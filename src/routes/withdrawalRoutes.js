const express = require("express");

const router = express.Router();

const {
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} = require(
  "../controllers/withdrawalController"
);

router.get(
  "/pending",
  getPendingWithdrawals
);

router.put(
  "/approve/:withdrawalId",
  approveWithdrawal
);

router.put(
  "/reject/:withdrawalId",
  rejectWithdrawal
);

module.exports = router;