const pool = require("../config/db");
const notificationService = require("../services/notificationService");

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    studentId: row.student_id,
    department: row.department,
    studentCardImagePath: row.student_card_image_path,
    role: row.role,
    accountStatus: row.account_status,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listPendingUsers(req, res) {
  const [rows] = await pool.query(
    `SELECT *
     FROM users
     WHERE account_status = 'PENDING' AND role = 'USER'
     ORDER BY created_at ASC`
  );

  res.json(rows.map(mapUser));
}

async function approveUser(req, res) {
  await pool.query(
    `UPDATE users
     SET account_status = 'APPROVED', approved_at = CURRENT_TIMESTAMP, approved_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND account_status = 'PENDING'`,
    [req.user.id, req.params.id]
  );

  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);

  if (!rows.length) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }

  await notificationService.createUserNotification(rows[0].id, {
    type: "APPROVAL",
    title: "회원가입 승인 완료",
    message: "관리자 승인이 완료되어 로그인할 수 있습니다.",
    dedupeKeyBase: `user-approved:${rows[0].id}`,
  });

  res.json({
    message: "사용자 계정을 승인했습니다.",
    user: mapUser(rows[0]),
  });
}

async function rejectUser(req, res) {
  await pool.query(
    `UPDATE users
     SET account_status = 'REJECTED', approved_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND account_status = 'PENDING'`,
    [req.user.id, req.params.id]
  );

  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);

  if (!rows.length) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }

  await notificationService.createUserNotification(rows[0].id, {
    type: "APPROVAL",
    title: "회원가입 승인 거절",
    message: "회원가입 신청이 거절되었습니다. 관리자에게 문의해주세요.",
    dedupeKeyBase: `user-rejected:${rows[0].id}`,
  });

  res.json({
    message: "사용자 계정을 거절 처리했습니다.",
    user: mapUser(rows[0]),
  });
}

module.exports = {
  listPendingUsers,
  approveUser,
  rejectUser,
};

