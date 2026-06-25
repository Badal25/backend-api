const express = require("express");

const authMiddleware =
require("../middleware/authMiddleware");

const {
  getActiveRide
} = require("../controllers/activeRideController");

const router = express.Router();

router.get(
  "/active",
  authMiddleware,
  getActiveRide
);

module.exports = router;