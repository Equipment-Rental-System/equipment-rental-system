require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs'); // Mac M1/M2의 설치 오류 방지 및 Windows 환경과의 호환성을 위해 bcryptjs(순수 JS 구현체라 OS에 상관없이 동일하게 작동) 사용
const multer = require('multer');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');
const { rootCertificates } = require('tls');

const {authenticateToken, isAdmin} = require('./auth.js'); //사용자 인증 및 관리자 인증 모듈
const { get } = require('http');
const { json } = require('stream/consumers');
const { arch } = require('os');
const cron = require('node-cron');

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

      const insertNotificationSql = `
        INSERT INTO notifications (user_id, type, message, is_read, created_at)
        VALUES (?, 'ACCOUNT_APPROVED', '회원가입이 승인되었습니다. 로그인 후 서비스를 이용할 수 있습니다.', FALSE, NOW())
      `;

      db.query(insertNotificationSql, [userId], (notifyErr) => {
        if (notifyErr) {
          console.log("가입 승인 알림 저장 실패 : ", notifyErr);

          return res.status(500).json({
            message : `가입 승인은 완료되었지만 알림 저장에 실패했습니다.`
          });
        }

        return res.status(200).json({
          message : `가입 승인 성공`,
          user_id : userId
        });
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
        return res.status(500).json({
          message : `회원가입 거절 실패`
        });
      }

      if(!updateResult.affectedRows){
        res.status(404).json({
          message : `해당 사용자를 찾을 수 없습니다.`
        });
      }
      
      const insertNotificationSql = `
        INSERT INTO notifications (user_id, type, message, is_read, created_at)
        VALUES (?, 'ACCOUNT_REJECTED', '회원가입이 거절되었습니다. 입력 정보를 확인 후 다시 신청해주세요.', FALSE, NOW())
      `;

      db.query(insertNotificationSql, [userId], (notifyErr) => {
        if (notifyErr) {
          console.log("가입 거절 알림 저장 실패 : ", notifyErr);

          return res.status(500).json({
            message : `회원가입 거절은 완료되었지만 알림 저장에 실패했습니다.`
          });
        }

        return res.status(200).json({
          message : `회원가입 거절 성공`,
          user_id : userId
        });
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
      return res.status(400).json({
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
      message : `기자재 데이터를 성공적으로 불러왔습니다.`,
      data: getResult
    });

  });
})
.get('/api/admin/items/:id', authenticateToken, isAdmin, (req, res) => { //상세 조회
  const itemId = req.params.id;

  const getSql = `SELECT * FROM items WHERE item_id = ?`;

  db.query(getSql, [itemId], (getErr, getResult) => {
    if(getErr) {
      return res.status(500).json({
        message : `서버 오류`
      });
    }

    if(getResult.length == 0){
      res.status(404).json({
        message : `기자재를 찾을 수 없습니다.`
      });
    }

    const item = getResult[0];

    qrcode.toDataURL(item.qr_code_value, (qrErr, url) => {
      if(qrErr){ //데이터는 불러왔으니 200코드 qr코드 생성 실패.
        return res.status(200).json({
          message : `데이터를 불러왔으나 qr 생성에 실패해습니다.`,
          item : item
        });
      }
      
      return res.status(200).json({
        message : `기자재 정보를 불러왔습니다.`,
        item : {
          ...item,
          qrImage : url
        }
      });

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

    qrcode.toDataURL(qrCodeValue, (qrErr, url) => {
      if(qrErr){
        return res.status(500).json({
          message : `QR코드 생성 실패`
        });
      }

      return res.status(201).json({
        message : `데이터가 성공적으로 추가되었습니다.`,
        itemId : PostResult.item_id,
        qrImage : url
      });
    });

  });
})
.put('/api/admin/update-item/:id', authenticateToken, isAdmin, (req,res) => { //기자재 내역 수정, 동적 쿼리 이용
  const itemId = req.params.id;
  const { item_name, category, status } = req.body;

  // 업데이트할 항목들을 담을 배열
  let updateFields = [];
  let params = [];

  // 값이 들어온 것만 체크해서 푸시(push)
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

  // 만약 아무것도 입력 안한 경우
  if (updateFields.length === 0) {
    return res.status(400).json({ 
      message: "수정할 내용이 없습니다." });
  }

  // 쿼리 조립
  // 예: "item_name = ?, status = ?"
  let updateSql = `UPDATE items SET ${updateFields.join(", ")} WHERE item_id = ?`;
  
  // ID 추가
  params.push(itemId);

  db.query(updateSql, params, (err, result) => {
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

  db.query(`SELECT status FROM items WHERE item_id = ?`, itemId, (getErr, getReslt) =>{
    if(getErr){
      return res.status(500).json({
        message : `서버 오류`
      });
    }

    if(getReslt.length == 0){
      return res.status(404).json({
        message : `존재하지 않는 기자재 입니다.`
      });
    }

    const itemStatus = getReslt[0].status;

    if(itemStatus == 'RENTED'){
      return res.status(400).json({
        message : `대여중인 기자재는 삭제할 수 없습니다.`
      });
    }

    db.query('DELETE FROM items WHERE item_id = ?', itemId, (deleteErr, deleteResult) =>{
      if(deleteErr){
        return res.status(500).json({
          message : `서버에러`
        });
      }

      return res.status(200).json({
        message : `기자재가 성공적으로 삭제되었습니다.`
      });
    })

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
.get('/api/get-laptop', authenticateToken, (req, res) => { //노트북 데이터 읽어옴
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

// 6. 기자재 대여 (반납일은 서버에서 자동 계산)
app.post('/api/rentals', authenticateToken, (req, res) => {
  const { item_id } = req.body;
  const userId = req.user.userId;

  if (!item_id) {
    return res.status(400).json({
      message: 'item_id는 필수입니다.'
    });
  }

  //반납일 계산 (현재 날짜 + 7일)
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(now.getDate() + 7);

  // 1. 기자재 확인
  const checkItemSql = `
    SELECT item_id, item_name, status
    FROM items
    WHERE item_id = ?
  `;

  db.query(checkItemSql, [item_id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('기자재 조회 실패:', checkErr);
      return res.status(500).json({ message: '서버 오류' });
    }

    if (checkResult.length === 0) {
      return res.status(404).json({
        message: '해당 기자재를 찾을 수 없습니다.'
      });
    }

    const item = checkResult[0];

    if (item.status !== 'AVAILABLE') {
      return res.status(400).json({
        message: '현재 대여 가능한 기자재가 아닙니다.'
      });
    }

    // 2. 대여 기록 저장
    const insertRentalSql = `
      INSERT INTO rentals (user_id, item_id, due_at, status)
      VALUES (?, ?, ?, 'RENTED')
    `;

    db.query(insertRentalSql, [userId, item_id, dueDate], (rentalErr, rentalResult) => {
      if (rentalErr) {
        console.error('대여 기록 저장 실패:', rentalErr);
        return res.status(500).json({
          message: '대여 처리 실패'
        });
      }

      // 3. 기자재 상태 변경
      const updateItemSql = `
        UPDATE items
        SET status = 'RENTED'
        WHERE item_id = ?
      `;

      db.query(updateItemSql, [item_id], (updateErr) => {
        if (updateErr) {
          console.error('기자재 상태 변경 실패:', updateErr);
          return res.status(500).json({
            message: '기자재 상태 변경 실패'
          });
        }

        // 4. 응답
        return res.status(201).json({
          message: '기자재 대여 성공',
          rental_id: rentalResult.insertId,
          item_id: item_id,
          due_at: dueDate
        });
      });
    });
  });
});

// 7. 관리자 반납 처리 API (트랜잭션 적용)
app.put('/api/admin/return/:rentalId', authenticateToken, isAdmin, (req, res) => {
  const rentalId = req.params.rentalId;
  const { issue_type = null, description = null } = req.body;

  // issue_type 허용값 검사
  const validIssueTypes = [null, 'LOST', 'BROKEN', 'PARTIAL_LOST'];
  if (!validIssueTypes.includes(issue_type)) {
    return res.status(400).json({
      message: '유효하지 않은 issue_type입니다.'
    });
  }

  db.getConnection((connErr, connection) => {
    if (connErr) {
      console.error('DB 커넥션 획득 실패:', connErr);
      return res.status(500).json({ message: '서버 오류' });
    }

    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release();
        console.error('트랜잭션 시작 실패:', txErr);
        return res.status(500).json({ message: '서버 오류' });
      }

      // 1. 현재 대여 정보 조회
      const getRentalSql = `
        SELECT rental_id, user_id, item_id, status
        FROM rentals
        WHERE rental_id = ?
      `;

      connection.query(getRentalSql, [rentalId], (rentalErr, rentalResult) => {
        if (rentalErr) {
          return connection.rollback(() => {
            connection.release();
            console.error('대여 정보 조회 실패:', rentalErr);
            return res.status(500).json({ message: '대여 정보 조회 실패' });
          });
        }

        if (rentalResult.length === 0) {
          return connection.rollback(() => {
            connection.release();
            return res.status(404).json({ message: '해당 대여 기록을 찾을 수 없습니다.' });
          });
        }

        const rental = rentalResult[0];

        if (rental.status !== 'RENTED' && rental.status !== 'OVERDUE') {
          return connection.rollback(() => {
            connection.release();
            return res.status(400).json({ message: '현재 반납 처리할 수 없는 상태입니다.' });
          });
        }

        // 2. rentals 반납 처리
        const updateRentalSql = `
          UPDATE rentals
          SET status = 'RETURNED',
              returned_at = NOW()
          WHERE rental_id = ?
        `;

        connection.query(updateRentalSql, [rentalId], (updateRentalErr) => {
          if (updateRentalErr) {
            return connection.rollback(() => {
              connection.release();
              console.error('반납 처리 실패:', updateRentalErr);
              return res.status(500).json({ message: '반납 처리 실패' });
            });
          }

          // 3. items 상태 결정
          let itemStatus = 'AVAILABLE';
          if (issue_type === 'LOST' || issue_type === 'BROKEN' || issue_type === 'PARTIAL_LOST') {
            itemStatus = issue_type;
          }

          const updateItemSql = `
            UPDATE items
            SET status = ?
            WHERE item_id = ?
          `;

          connection.query(updateItemSql, [itemStatus, rental.item_id], (updateItemErr) => {
            if (updateItemErr) {
              return connection.rollback(() => {
                connection.release();
                console.error('기자재 상태 변경 실패:', updateItemErr);
                return res.status(500).json({ message: '기자재 상태 변경 실패' });
              });
            }

            // 4. 이슈가 있는 경우 issue_log 저장
            const saveIssueLog = (callback) => {
              if (!issue_type) return callback();

              const insertIssueSql = `
                INSERT INTO item_issue_log (rental_id, item_id, issue_type, description)
                VALUES (?, ?, ?, ?)
              `;

              connection.query(
                insertIssueSql,
                [rental.rental_id, rental.item_id, issue_type, description],
                (issueErr) => {
                  if (issueErr) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error('이슈 로그 저장 실패:', issueErr);
                      return res.status(500).json({ message: '이슈 로그 저장 실패' });
                    });
                  }
                  callback();
                }
              );
            };

            // 5. 알림 저장
            const saveNotification = () => {
              let notificationType = 'RETURNED';
              let notificationMessage = '기자재 반납이 정상 처리되었습니다.';

              if (issue_type) {
                notificationType = issue_type;
                if (issue_type === 'BROKEN') {
                  notificationMessage = '반납 처리 중 기자재 파손이 확인되었습니다.';
                } else if (issue_type === 'LOST') {
                  notificationMessage = '반납 처리 중 기자재 분실이 확인되었습니다.';
                } else if (issue_type === 'PARTIAL_LOST') {
                  notificationMessage = '반납 처리 중 일부 구성품 누락이 확인되었습니다.';
                }
              }

              const insertNotificationSql = `
                INSERT INTO notifications (user_id, rental_id, type, message, is_read, created_at)
                VALUES (?, ?, ?, ?, FALSE, NOW())
              `;

              connection.query(
                insertNotificationSql,
                [rental.user_id, rental.rental_id, notificationType, notificationMessage],
                (notifyErr) => {
                  if (notifyErr) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error('알림 저장 실패:', notifyErr);
                      return res.status(500).json({ message: '알림 저장 실패' });
                    });
                  }

                  // 6. 커밋
                  connection.commit((commitErr) => {
                    if (commitErr) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error('커밋 실패:', commitErr);
                        return res.status(500).json({ message: '반납 처리 최종 저장 실패' });
                      });
                    }

                    connection.release();

                    return res.status(200).json({
                      message: issue_type ? '반납 및 이슈 처리 완료' : '기자재 반납 처리 완료',
                      rental_id: rental.rental_id,
                      item_id: rental.item_id,
                      item_status: itemStatus,
                      notification_type: notificationType
                    });
                  });
                }
              );
            };

            saveIssueLog(saveNotification);
          });
        });
      });
    });
  });
});

//8. qr코드 스캔 핸들러
app
.post("/api/qr-scan", authenticateToken, (req, res) => {
  const {qrCodeValue} = req.body; 
  const {userId, role} = req.user; //유저 정보 토큰에서 추출

  const postSql = `SELECT item_id, item_name, status 
                   FROM items WHERE qr_code_value = ?`;

  db.query(postSql, [qrCodeValue], (postErr, postResult) => {
    if(postErr){
      console.log("qr인식 중 오류 : ", postErr);
    
      return res.status(500).json({
        message : `서버 오류`
      });
    }

    if(postResult.length == 0) {
      return res.status(404).json({
        message : `인식이 불가한 qr입니다.`
      });
    }

    const item = postResult[0];

    //로직 분기 (대출/반납 여부에 따른 호출은 프론트에서 처리)
    if(item.status == 'AVAILABLE') { //대여
      return res.status(200).json({
        action : "RENT",
        item : item,
        message : `${item.item_name}을 대출하시겠습니까?`
      });
    }

    else if(item.status == "RENTED" || item.status == "OVERDUE"){ //반납
      if(role != 'ADMIN'){
        return res.status(403).json({
          message : `반납은 관리자만 가능합니다.`
        });
      }

      return res.status(200).json({
        action : 'RETURN',
        item : item,
        message : `반납 처리를 진행하시겠습니까?`
      });

    }

    else {
      return res.status(400).json({
        message : `현재 ${item.item_name}은 ${item.status} 상태라 이용하실 수 없습니다.`
      });
    }
  });

});

// 9. 관리자 전체 대여 조회 API
app.get('/api/admin/rentals', authenticateToken, isAdmin, (req, res) => {
  const sql = `
    SELECT
      r.rental_id,
      r.user_id,
      u.name,
      u.student_id,
      r.item_id,
      i.item_name,
      i.category,
      r.rented_at,
      r.due_at,
      r.returned_at,
      r.status
    FROM rentals r
    JOIN users u ON r.user_id = u.user_id
    JOIN items i ON r.item_id = i.item_id
    ORDER BY r.rented_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('관리자 대여 조회 실패:', err);
      return res.status(500).json({ message: '관리자 대여 조회 실패' });
    }

    return res.status(200).json({
      message: '관리자 대여 조회 성공',
      data: results
    });
  });
});

// 10. 관리자 이슈 로그 조회 API
app.get('/api/admin/issues', authenticateToken, isAdmin, (req, res) => {
  const sql = `
    SELECT
      il.issue_id,
      il.rental_id,
      il.item_id,
      i.item_name,
      i.category,
      il.issue_type,
      il.description,
      il.created_at,
      r.user_id,
      u.name,
      u.student_id
    FROM item_issue_log il
    JOIN rentals r ON il.rental_id = r.rental_id
    JOIN users u ON r.user_id = u.user_id
    JOIN items i ON il.item_id = i.item_id
    ORDER BY il.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('관리자 이슈 로그 조회 실패:', err);
      return res.status(500).json({ message: '관리자 이슈 로그 조회 실패' });
    }

    return res.status(200).json({
      message: '관리자 이슈 로그 조회 성공',
      data: results
    });
  });
});

//11. 사용자 알림 조회 및 읽음 처리
app
.get("/api/notification", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const getSql = `SELECT notification_id, type, message, is_read, 
                  DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at
                  FROM notifications
                  WHERE user_id = ? AND is_read = FALSE
                  ORDER BY created_at DESC`;

  db.query(getSql, [userId], (getErr, getResult) => {
    if(getErr){
      console.log("알림 조회 중 오류 : ", getErr);

      return res.status(500).json({
        message : `서버 오류`
      });
    }

    return res.status(200).json({
      message : getResult.length == 0 ? `새로운 알림이 없습니다.` : `총 ${getResult.length}건의 알림이 있습니다.`,
      notifications : getResult
    });

  }); 
})
.put("/api/notification/read/:id", authenticateToken, (req, res) => {
  const notificationId =req.params.id;
  const userId = req.user.userId;

  const updateSql = `UPDATE notifications 
                      SET is_read = TRUE 
                      WHERE notification_id = ? AND user_id = ? AND is_read = FALSE`;
  
  db.query(updateSql, [notificationId, userId], (updateErr, updateResult) => {
    if(updateErr){
      console.log("알림 읽음 처리 중 오류 : ", updateErr);

      return res.status(500).json({
        message : `서버 오류`
      });
    }

    if(updateResult.length == 0){
      return res.status(404),json({
        message : `해당 알림이 존재하지 않거나, 본인의 알림이 아닙니다.`
      });
    }

    return res.status(200).json({
      message : `알림이 읽음 처리가 되었습니다.`,
      notificationId : notificationId
    });
  });

});

//12. 사용자 대여 내역 조회
app.get("/api/rentals", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const getSql = `SELECT 
                    r.rental_id, 
                    i.item_name, 
                    i.category,
                    r.status, 
                    DATE_FORMAT(r.rented_at, '%Y-%m-%d %H:%i') AS rented_at, 
                    DATE_FORMAT(r.due_at, '%Y-%m-%d') AS due_at
                  FROM rentals r
                  JOIN items i ON r.item_id = i.item_id
                  WHERE r.user_id = ?
                  ORDER BY r.rented_at DESC`;

  db.query(getSql, [userId], (getErr, getResult) => {
    if(getErr){
      console.log("대여 내역 불러오는 중 오류 : ", getErr);

      return res.status(500).json({
        message : `서버 오류`
      });
    }

    return res.status(200).json({
      message : getResult.length === 0 ? "대여 내역이 없습니다." : `총 ${getResult.length}건의 대여 내역이 있습니다.`,
      rentals : getResult
    });

  });
});

//13. 관리자 대시보드
app
.get("/api/admin/dashboard", authenticateToken, isAdmin, async(req, res) => {
  try{
    //승인 대기 유저
    const [pendingUsers] = await db.promise().query(
      "SELECT COUNT(*) AS count FROM users WHERE approval_status = 'PENDING'"
    );

    // 연체 중 물품 수
    const [overdueRentals] = await db.promise().query(
      "SELECT COUNT(*) AS count FROM rentals WHERE status = 'OVERDUE'"
    );

    // 대여 중인 기자재 수
    const [rentedItems] = await db.promise().query(
      "SELECT COUNT(*) AS count FROM items WHERE status = 'RENTED'"
    );

    //최근 대여/반납 활동
    const [recentActivities] = await db.promise().query(`
      SELECT 
        r.status AS actionType, 
        u.name AS userName, 
        u.student_id AS studentId, 
        i.item_name AS itemName,
        r.rented_at,
        r.returned_at
      FROM rentals r
      JOIN users u ON r.user_id = u.user_id
      JOIN items i ON r.item_id = i.item_id
      ORDER BY COALESCE(r.returned_at, r.rented_at) DESC
      LIMIT 4
    `);

    res.status(200).json({
      summary: {
        pendingUsers: pendingUsers[0].count,
        overdueItems: overdueRentals[0].count,
        rentingItems: rentedItems[0].count
      },
      recentActivities: recentActivities
    });

  } catch (err) {
    console.log(`대쉬보드 데이터 불러오는 중 오류 발생 : ${err}`);

    res.status(500).json({
      message : `서버 오류`
    });
  }
});


// 매일 자정마다 연체 상태 변경 + 연체 알림 생성
cron.schedule('0 0 * * *', async () => {
  console.log('[Scheduler] 연체 확인 시작');

  try {
    // 1. 연체 대상 조회
    const [overdueList] = await db.promise().query(`
      SELECT rental_id, user_id
      FROM rentals
      WHERE status = 'RENTED'
      AND due_at < NOW()
    `);

    // 2. RENTED → OVERDUE 변경
    await db.promise().query(`
      UPDATE rentals
      SET status = 'OVERDUE'
      WHERE status = 'RENTED'
      AND due_at < NOW()
    `);

    // 3. 연체 알림 생성
    for (const rental of overdueList) {
      const [existingNotification] = await db.promise().query(
        `
        SELECT notification_id
        FROM notifications
        WHERE rental_id = ?
        AND type = 'OVERDUE'
        `,
        [rental.rental_id]
      );

      if (existingNotification.length === 0) {
        await db.promise().query(
          `
          INSERT INTO notifications
          (user_id, rental_id, type, message, is_read, created_at)
          VALUES (?, ?, 'OVERDUE', '반납 예정일이 지나 연체 상태로 변경되었습니다.', FALSE, NOW())
          `,
          [rental.user_id, rental.rental_id]
        );
      }
    }

    console.log(`[Scheduler] 연체 처리 완료: ${overdueList.length}건`);
  } catch (error) {
    console.error('[Scheduler] 연체 처리 오류:', error);
  }
});


app.listen(process.env.PORT, () => {
  console.log(`${process.env.PORT} 번 포트에서 서버 실행중`);
});