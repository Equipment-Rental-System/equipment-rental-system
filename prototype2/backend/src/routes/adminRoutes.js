const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const adminUserController = require("../controllers/adminUserController");

const router = express.Router();

router.get(
  "/users/pending",
  requireAuth,
  requireAdmin,
  asyncHandler(adminUserController.listPendingUsers)
);
router.post(
  "/users/:id/approve",
  requireAuth,
  requireAdmin,
  asyncHandler(adminUserController.approveUser)
);
router.post(
  "/users/:id/reject",
  requireAuth,
  requireAdmin,
  asyncHandler(adminUserController.rejectUser)
);

module.exports = router;
