const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { comparePassword, hashPassword } = require("../utils/crypto");
const { toPublicUploadPath } = require("../utils/uploadPath");

function createToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || "smart-rental-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

async function signup(req, res) {
  const { name, studentId, department, password } = req.body;

  if (!name || !studentId || !department || !password) {
    return res.status(400).json({
      message: "이름, 학번, 학과, 비밀번호는 필수입니다.",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      message: "학생증 캡처 이미지를 업로드해주세요.",
    });
  }

  const [duplicateRows] = await pool.query(
    "SELECT id FROM users WHERE student_id = ? LIMIT 1",
    [studentId]
  );

  if (duplicateRows.length) {
    return res.status(409).json({ message: "이미 등록된 학번입니다." });
  }

  await pool.query(
    `INSERT INTO users
      (name, student_id, department, password_hash, student_card_image_path, role, account_status)
     VALUES (?, ?, ?, ?, ?, 'USER', 'PENDING')`,
    [
      name,
      studentId,
      department,
      hashPassword(password),
      toPublicUploadPath(req.file.path),
    ]
  );

  res.status(201).json({
    message: "회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.",
  });
}

async function login(req, res) {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({
      message: "학번과 비밀번호를 입력해주세요.",
    });
  }

  const normalizedStudentId = String(studentId).trim().toLowerCase();

  const [rows] = await pool.query(
    `SELECT id, name, student_id, department, student_card_image_path,
            password_hash, role, account_status
     FROM users
     WHERE LOWER(student_id) = ?
     LIMIT 1`,
    [normalizedStudentId]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "등록되지 않은 학번입니다." });
  }

  const user = rows[0];

  const isPasswordValid = comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  if (user.account_status === "PENDING") {
    return res.status(403).json({
      message: "관리자 승인 후 로그인 가능합니다.",
    });
  }

  if (user.account_status === "REJECTED") {
    return res.status(403).json({
      message: "승인 거절된 계정입니다. 관리자에게 문의해주세요.",
    });
  }

  const token = createToken(user);

  return res.json({
    message: "로그인에 성공했습니다.",
    token,
    user: {
      id: user.id,
      name: user.name,
      studentId: user.student_id,
      department: user.department,
      studentCardImagePath: user.student_card_image_path,
      role: user.role,
      accountStatus: user.account_status,
    },
  });
}

async function me(req, res) {
  const [rows] = await pool.query(
    `SELECT id, name, student_id, department, student_card_image_path,
            role, account_status
     FROM users
     WHERE id = ?`,
    [req.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "사용자 정보를 찾을 수 없습니다." });
  }

  res.json({
    user: {
      id: rows[0].id,
      name: rows[0].name,
      studentId: rows[0].student_id,
      department: rows[0].department,
      studentCardImagePath: rows[0].student_card_image_path,
      role: rows[0].role,
      accountStatus: rows[0].account_status,
    },
  });
}

module.exports = {
  signup,
  login,
  me,
};
