const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  sendOtp,
  verifyOtp,
  completeProfile,
  getProfile,
} = require("../controllers/authController");

const router = express.Router();

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtp);

router.post("/complete-profile", completeProfile);

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

module.exports = router;