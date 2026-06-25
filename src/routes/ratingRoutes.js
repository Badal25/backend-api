const express = require("express");

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const {
  giveRating,
  getUserRating
} = require("../controllers/ratingController");

const router = express.Router();

router.post(
  "/give-rating",
  authMiddleware,
  giveRating
);

router.get(
  "/user/:userId",
  getUserRating
);

module.exports = router;