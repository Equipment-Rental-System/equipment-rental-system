const notificationService = require("../services/notificationService");

async function listNotifications(req, res) {
  const notifications = await notificationService.listNotifications(req.user.id, req.query);
  res.json(notifications);
}

async function markRead(req, res) {
  const notification = await notificationService.markRead(req.user.id, req.params.id);
  res.json({
    message: "알림을 읽음 처리했습니다.",
    notification,
  });
}

async function markAllRead(req, res) {
  const result = await notificationService.markAllRead(req.user.id);
  res.json({
    message: "모든 알림을 읽음 처리했습니다.",
    updatedCount: result.updatedCount,
  });
}

module.exports = {
  listNotifications,
  markRead,
  markAllRead,
};

