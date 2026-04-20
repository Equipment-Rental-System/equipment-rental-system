const pool = require("../config/db");
const { USER_ROLES } = require("../utils/constants");

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function mapNotification(row) {
  return {
    id: row.id,
    userId: row.user_id,
    rentalId: row.rental_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

async function getAdminUsers() {
  const [rows] = await pool.query(
    "SELECT id, name, student_id FROM users WHERE role = ? ORDER BY id ASC",
    [USER_ROLES.ADMIN]
  );
  return rows;
}

async function createNotifications(userIds, payload) {
  if (!userIds.length) {
    return;
  }

  const placeholders = [];
  const values = [];

  userIds.forEach((userId) => {
    placeholders.push("(?, ?, ?, ?, ?, ?, ?)");
    values.push(
      userId,
      payload.rentalId || null,
      payload.type,
      payload.title,
      payload.message,
      0,
      `${payload.dedupeKeyBase}:${userId}`
    );
  });

  await pool.query(
    `INSERT INTO notifications
      (user_id, rental_id, type, title, message, is_read, dedupe_key)
     VALUES ${placeholders.join(", ")}
     ON DUPLICATE KEY UPDATE id = id`,
    values
  );
}

async function createUserNotification(userId, payload) {
  await createNotifications([userId], payload);
}

async function createAdminNotifications(payload) {
  const admins = await getAdminUsers();
  await createNotifications(
    admins.map((admin) => admin.id),
    payload
  );
}

async function listNotifications(userId, query = {}) {
  const params = [userId];
  let whereClause = "WHERE user_id = ?";

  if (query.onlyUnread === "true") {
    whereClause += " AND is_read = 0";
  }

  const [rows] = await pool.query(
    `SELECT *
     FROM notifications
     ${whereClause}
     ORDER BY created_at DESC, id DESC`,
    params
  );

  return rows.map(mapNotification);
}

async function markRead(userId, notificationId) {
  await pool.query(
    "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
    [notificationId, userId]
  );

  const [rows] = await pool.query(
    "SELECT * FROM notifications WHERE id = ? AND user_id = ?",
    [notificationId, userId]
  );

  if (!rows.length) {
    throw createError("알림을 찾을 수 없습니다.", 404);
  }

  return mapNotification(rows[0]);
}

async function markAllRead(userId) {
  const [result] = await pool.query(
    "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
    [userId]
  );

  return {
    updatedCount: result.affectedRows,
  };
}

module.exports = {
  getAdminUsers,
  createUserNotification,
  createAdminNotifications,
  listNotifications,
  markRead,
  markAllRead,
};
