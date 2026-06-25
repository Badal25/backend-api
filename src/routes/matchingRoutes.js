const express = require("express");

const authMiddleware =
require("../middleware/authMiddleware");

const {
  findMatchingRides,
  findNearbyRides
} = require("../controllers/matchingController");

const router = express.Router();

router.get(
  "/find",
  authMiddleware,
  findMatchingRides
);

router.get(
  "/nearby",
  authMiddleware,
  findNearbyRides
);
module.exports = router;