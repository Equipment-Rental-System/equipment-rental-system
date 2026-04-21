require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs'); // Mac M1/M2의 설치 오류 방지 및 Windows 환경과의 호환성을 위해 bcryptjs(순수 JS 구현체라 OS에 상관없이 동일하게 작동) 사용
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { rootCertificates } = require('tls');

const {authenticateToken, isAdmin} = require('./auth.js'); //사용자 인증 및 관리자 인증 모듈
const { get } = require('http');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// DB 연결
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.query('SELECT 1', (err, results) => {
  if (err) {
    console.error('DB 연결 실패:', err);
    return;
  }
  console.log('MySQL Pool 연결 성공');
});

// [파일 저장 설정] 하드디스크에 파일을 저장하기 위한 multer 상세 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `verify_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// 서버 체크
app.get('/', (req, res) => {
  res.send('서버 정상 실행');
});

// DB 체크
app.get('/api/test-db', (req, res) => {
  db.query('SELECT 1 AS ok', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'DB 실패' });
    }
    res.json({ message: 'DB 연결 성공', result: rows[0].ok });
  });
});


// 1. 회원가입 API [ http://localhost:3000/api/signup ] 2026.4.16 push
app.post('/api/signup', upload.single('verification_image'), async (req, res) => {
  try {
    const { student_id, name, email, password } = req.body;
    const verificationImage = req.file ? req.file.filename : null;

    // 필수값 확인
    if (!student_id || !name || !email || !password || !verificationImage) {
      return res.status(400).json({
        message: '학번, 이름, 이메일, 비밀번호, 인증 이미지는 모두 필수입니다.'
      });
    }

    // 중복 확인
    const checkSql = `
      SELECT * FROM users
      WHERE student_id = ? OR email = ?
    `;

    db.query(checkSql, [student_id, email], async (checkErr, checkResults) => {
      if (checkErr) {
        console.error('중복 확인 실패:', checkErr);
        return res.status(500).json({ message: '서버 오류' });
      }

      if (checkResults.length > 0) {
        // 업로드된 파일 삭제
        if (req.file) {
          fs.unlink(`uploads/${req.file.filename}`, (err) => {
            if (err) {
            console.error('파일 삭제 실패:', err);
            } else {
              console.log('중복으로 업로드된 파일 삭제 완료');
            }
          });
        }

        return res.status(409).json({
          message: '이미 존재하는 학번 또는 이메일입니다.'
        });
      }

      // 비밀번호 해시
      const hashedPassword = await bcrypt.hash(password, 10);

      // 회원 저장
      const insertSql = `
        INSERT INTO users
        (student_id, name, email, password, role, verification_image, approval_status, approved_at, created_at)
        VALUES (?, ?, ?, ?, 'USER', ?, 'PENDING', NULL, NOW())
      `;

      db.query(
        insertSql,
        [student_id, name, email, hashedPassword, verificationImage],
        (insertErr, insertResult) => {
          if (insertErr) {
            console.error('회원가입 실패:', insertErr);
            return res.status(500).json({ message: '회원가입 실패' });
          }

          return res.status(201).json({
            message: '회원가입 완료. 관리자 승인 후 로그인 가능합니다.',
            user_id: insertResult.insertId
          });
        }
      );
    });
  } catch (error) {
    console.error('회원가입 처리 중 오류:', error);
    return res.status(500).json({ message: '서버 오류' });
  }
});


// 2. 관리자 승인 API 만들기 2026.04.18 push
app
.get('/api/admin/get-data', authenticateToken, isAdmin, async(req, res) => { //회원 신청 정보 db에서 가져옴.
  try{
    const selectSql = `SELECT user_id, name, student_id, verification_image
                        FROM users
                        WHERE approval_status = ?`; //가입 승인 대기자 가져오는 쿼리문

    db.query(selectSql, ['PENDING'], async(selectErr, selectResult) => {
      if(selectErr){
        res.status(500).json({
          message : `가입 대기자 데이터 불러오기 실패`
        });
      }

      return res.status(200).json({
          message : `가입 대기자 데이터 불러오기 성공`,
        });

    });


  } catch(error){
    console.log(`회원 승인 대기자 정보 가져오는 중 오류 발생 : ${error}`);

    res.status(500).json({
      message : `서버 오류`
    });
  }
})
.put('/api/admin/approval/:id', authenticateToken, isAdmin, async(req, res) => { //가입 승인 (id는 front에서 호출할 때 기입)
  const userId = req.params.id;
  
  try{
    const updateSql =`UPDATE users 
                      SET 
                      approval_status = 'APPROVED',
                      approved_at = NOW()
                      WHERE user_id = ?
                      `;

    db.query(updateSql, [userId], (updateErr, updateResult) => {
      if(updateErr){
        console.log("회원가입 승인 실패 : ", updateErr);

        return res.status(500).json({
          message : `회원가입 승인 실패`
        });
      }

      if(!updateResult.affectedRows){
        return res.status(404).json({
          message : `해당 사용자를 찾을 수 없습니다.`
        });
      }

      return res.status(200).json({
        message : `가입 승인 성공`,
        user_id : userId
      });
    })

  } catch(error) {
    console.log(`회원가입 승인 처리 중 오류 : ${error}`);

    res.status(500).json({
      message : `서버오류`
    });
  }
})
.put('/api/admin/reject/:id', authenticateToken, isAdmin, async(req, res) => { //가입 거절(id는 프론트에서 호출 시 기입)
  const userId = req.params.id;

  try{
    const updateSql =`UPDATE users 
                      SET 
                      approval_status = 'REJECTED',
                      approved_at = NOW()
                      WHERE user_id = ?
                      `;

    db.query(updateSql, [userId], (updateErr, updateResult) => {
      if(updateErr){
        res.status(500).json({
          message : `회원가입 거절 실패`
        });
      }

      if(!updateResult.affectedRows){
        res.status(404).json({
          message : `해당 사용자를 찾을 수 없습니다.`
        });
      }
      
      return res.status(200).json({
        message : `회원가입 거절 성공`,
        user_id : userId
      });
    });
    
  } catch(error) {
    console.log(`회원가입 거절 처리 중 오류 : ${error}`);

    return res.status(500).json({
      message : `서버오류`
    });
  }
});

// 3. 로그인 API 만들기
app.post("/api/login", async(req, res) => {
  try{
    
    const {studentId, password} = req.body;

    if(!studentId || !password){
      res.status(400).json({
        message : `학번 혹은 비밀번호는 필수 입력 값입니다.`
      });
    }

    const loginSql = `SELECT user_id, student_id, email, password, name, role, approval_status
                      FROM users
                      WHERE student_id = ?`
    
    db.query(loginSql, [studentId], async(loginErr, userRow) => {
      
      if(loginErr){ //로그인 실패한 경우

        console.log('로그인 처리 실패 : ', loginErr);

        return res.status(500).json({
          message : `로그인 실패`
        });
      }

      if(userRow.length == 0){ //존재하지 않는 사용자인 경우
        return res.status(404).json({
          message : `존재하지 않는 사용자 입니다.`
        });
      }

      const user = userRow[0]; //가지고온 유저 정보

      if(user.approval_status != 'APPROVED'){
        //가입 승인 대기 중이거나 거절인 사용자가 로그인을 시도하는 경우

        return res.status(403).json({
          message : `가입 대기 중 혹은 가입 거부 된 사용자 입니다.`
        });
      }

      const passwordAvaild = await bcrypt.compare(password, user.password); //비밀번호 일치하는지 비교

      if(!passwordAvaild){ //잘못된 비밀번호를 입력한 경우
        return res.status(400).json({
          message : `이메일 혹은 비밀번호를 잘못 입력하셨습니다.`
        });
      }

      //jwt 발급
      const token = jwt.sign({ //payload : 사용자 정보
        userId : user.user_id, 
        role : user.role,
        email : user.email
      }, 
      process.env.JWT_SECRET, //SECRET KEY
      {expiresIn : '1h'} //토큰 유효기간, 1시간
      );

      return res.status(201).json({
        mseeage : `로그인 성공`,
        token : token,
        user: {
          id : user.user_id,
          name : user.name,
          role : user.role
        }
      });
    });
  } catch(error) {
    console.log('로그인 중 오류 발생 : ', error);

    res.status(500).json({
      message : `서버오류`
    });
  }

})
.get('/api/logout', async(req, res) => { //로그아웃, 토큰 삭제 처리를 프론트에서 진행

  return res.status(200).json({
    message : `로그아웃에 성공했습니다.`
  });

});

// 4. 관리자 기자재 crud
app
.get('/api/admin/items', authenticateToken, isAdmin, (req, res) => { //기자재 조회
  const {category} = req.query; //만약 검색을 한다면? 

  let getSql = `SELECT * FROM items`;

  let params = [];

  if(category){
    getSql += `WHERE category = ?`;
    params.push(category);
  }

  db.query(getSql, (getErr, getResult) => {
    if(getErr){
      return res.status(500).json({
        message : `서버 오류`
      });
    }

    return res.status(200).json({
      message : `기자재 데이터를 성공적으로 불러왔습니다.`
    });

  });
})
.post('/api/admin/add-item', authenticateToken, isAdmin, (req, res) => { //기자재 등록
  const {itemName, category, qrCodeValue} = req.body;

  if(!itemName || !category || !qrCodeValue){
    return res.status(400).json({
      message : `기가재 이름, 기자재 종류, qr코드 값은 필수입니다.`
    })
  }

  const postSql = `INSERT INTO items
                   (item_name, category, qr_code_value, created_at)
                   VALUES (?, ?, ?, Now())`;
  
  db.query(postSql, [itemName, category, qrCodeValue], (postErr, PostResult) => {
    if(postErr){
      return res.status(500).json({
        message : `서버 오류`
      });
    }

    return res.status(201).json({
      message : `데이터가 성공적으로 추가되었습니다.`,
      itemId : PostResult.item_id
    });

  });
})
.put('/api/admin/update-item/:id', authenticateToken, isAdmin, (req,res) => { //기자재 내역 수정, 동적 쿼리 이용
  const itemId = req.params.id;
  const { item_name, category, status } = req.body;

  // 1. 업데이트할 항목들을 담을 배열
  let updateFields = [];
  let params = [];

  // 2. 값이 들어온 것만 체크해서 푸시(push)
  if (item_name) {
    updateFields.push("item_name = ?");
    params.push(item_name);
  }
  if (category) {
    updateFields.push("category = ?");
    params.push(category);
  }
  if (status) {
    updateFields.push("status = ?");
    params.push(status);
  }

  // 3. 만약 아무것도 안 들어왔다면?
  if (updateFields.length === 0) {
    return res.status(400).json({ message: "수정할 내용이 없습니다." });
  }

  // 쿼리 조립
  // 예: "item_name = ?, status = ?"
  let updateSql = `UPDATE items SET ${updateFields.join(", ")} WHERE item_id = ?`;
  
  // ID 추가
  params.push(itemId);

  db.query(updateSql, [params], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "수정 중 서버 오류 발생" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "해당 기자재를 찾을 수 없습니다." });
    }

    return res.status(200).json({ message: "기자재 정보가 성공적으로 수정되었습니다." });
  });
  
})
.delete('/api/admin/delete-item/:id', authenticateToken, isAdmin, (req, res) => { //기자재 삭제
  const itemId = req.params.id;

  const deleteSql = `DELETE * 
                     FROM items 
                    WHERE item_id = ?`

  db.query(deleteSql, [itemId], (deleteErr, deleteResult) => {
    if(deleteErr){
      return res.status(500).json({
        message : `서버 오류`
      });
    }

    res.status(200).json({
      message : `데이터 삭제에 성공했습니다.`
    });

  });

});

//5. 사용자 기자재 조회
app.
get('/api/get-aduino', authenticateToken, (req, res) => { //아두이노 데이터 읽어옴
  const getSql = `SELECT * FROM items
                  WHERE category = ?`;

  db.query(getSql, ['ARDUINO'], (getErr, getResult) => {

    if(getResult.length == 0){
      return res.status(404).json({
        message : `데이터가 존재하지 않습니다.`
      });
    }

    if(getErr){
      return res.status(500).json({
        message : `서버 오류`
      });
    }

    return res.status(200).json({
      message : `데이터 불러오기 성공`,
      data : getResult
    })
  });
})
.get('/api/get-raspberryPi', authenticateToken, (req, res) => { //라즈베리 파이 데이터 get
  const getSql = `SELECT * FROM items
                  WHERE category = ?`;

  db.query(getSql, ['RASPBERRY_PI'], (getErr, getResult) => {
    if(getResult.length == 0){ //데이터가 없는 경우
      return res.status(404).json({
        message : `데이터가 없습니다.`
      });
    }
    
    if(getErr){
      return res.status(500).json({
        message : `서버 오류`
      });
    }

    return res.status(200).json({
      message : `데이터 불러오기 성공`,
      data : getResult
    });
  });
  
})
.get('/api/get-laptop', (req, res) => { //노트북 데이터 읽어옴
  const getSql = `SELECT * FROM items
                  WHERE category = ?`;

  db.query(getSql, ['LAPTOP'], (getErr, getResult) => {
    if(getResult.length == 0){
      return res.status(404).json({
        message : `데이터가 없습니다.`
      });
    }

    if(getErr){
      return res.status(500).json({
        message : `서버 오류`
      });
    }

    return res.status(200).json({
      message : `데이터 불러오기 성공`,
      data : getResult
    });

  });
});

app.listen(process.env.PORT, () => {
  console.log(`${process.env.PORT} 번 포트에서 서버 실행중`);
});