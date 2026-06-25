const express = require("express");

const authMiddleware =
require("../middleware/authMiddleware");

const {
  getReferralCode,
  applyReferralCode,
  getReferralHistory
} = require(
  "../controllers/referralController"
);

const router = express.Router();

router.get(
  "/my-code",
  authMiddleware,
  getReferralCode
);

router.post(
  "/apply",
  authMiddleware,
  applyReferralCode
);

router.get(
  "/history",
  authMiddleware,
  getReferralHistory
);

module.exports = router;