require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs'); // Mac M1/M2의 설치 오류 방지 및 Windows 환경과의 호환성을 위해 bcryptjs(순수 JS 구현체라 OS에 상관없이 동일하게 작동) 사용
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

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


// 1. 회원가입 API [ http://localhost:3000/api/signup ]
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




// 2. 관리자 승인 API 만들기


// 3. 로그인 API 만들기


// 4. ~~~


app.listen(process.env.PORT, () => {
  console.log(`${process.env.PORT} 번 포트에서 서버 실행중`);
});