const express = require("express");

const authMiddleware =
require("../middleware/authMiddleware");

const {
  getUserStatus,
  saveFCMToken
} = require("../controllers/userController");

const router = express.Router();

router.get(
  "/status/:userId",
  authMiddleware,
  getUserStatus
);

router.post(
  "/save-fcm-token",
  authMiddleware,
  saveFCMToken
);

module.exports = router;