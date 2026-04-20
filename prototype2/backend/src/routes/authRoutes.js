const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { uploadStudentCard } = require("../middleware/upload");

const router = express.Router();

router.post("/signup", uploadStudentCard, asyncHandler(authController.signup));
router.post("/login", asyncHandler(authController.login));
router.get("/me", requireAuth, asyncHandler(authController.me));

module.exports = router;
