const express = require("express");

const authMiddleware =
require("../middleware/authMiddleware");

const {
  getRideMessages
} = require("../controllers/chatController");

const router = express.Router();

router.get(
  "/:rideId",
  authMiddleware,
  getRideMessages
);

module.exports = router;