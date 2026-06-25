const express = require("express");

const authMiddleware =
require("../middleware/authMiddleware");

const {
  getRideHistory
} = require("../controllers/rideHistoryController");

const router = express.Router();

router.get(
  "/my-history",
  authMiddleware,
  getRideHistory
);

module.exports = router;