const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(notificationController.listNotifications));
router.patch("/read-all", requireAuth, asyncHandler(notificationController.markAllRead));
router.patch("/:id/read", requireAuth, asyncHandler(notificationController.markRead));

module.exports = router;
