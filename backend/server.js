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
.get('/api/admin/get-data', async(req, res) => { //회원 신청 정보 db에서 가져옴.
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
.put('/api/admin/approval/:id', async(req, res) => { //가입 승인 (id는 front에서 호출할 때 기입)
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
.put('/api/admin/reject/:id', async(req, res) => { //가입 거절(id는 프론트에서 호출 시 기입)
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

      if(user.approval_stauts == 'PENDING' || user.approval_stauts == 'REJECTED'){
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

// 4. ~~~


app.listen(process.env.PORT, () => {
  console.log(`${process.env.PORT} 번 포트에서 서버 실행중`);
});