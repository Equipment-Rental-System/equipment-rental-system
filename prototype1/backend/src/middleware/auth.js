const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { USER_ROLES } = require("../utils/constants");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const token = header.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "smart-rental-secret");
    const [rows] = await pool.query(
      `SELECT id, name, student_id, department, student_card_image_path,
              role, account_status
       FROM users
       WHERE id = ?`,
      [decoded.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "유효하지 않은 사용자입니다." });
    }

    req.user = {
      id: rows[0].id,
      name: rows[0].name,
      studentId: rows[0].student_id,
      department: rows[0].department,
      studentCardImagePath: rows[0].student_card_image_path,
      role: rows[0].role,
      accountStatus: rows[0].account_status,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "세션이 만료되었거나 유효하지 않습니다." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({ message: "관리자 권한이 필요합니다." });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
