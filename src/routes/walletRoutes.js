const express = require("express");

const authMiddleware =
require("../middleware/authMiddleware");

const {
  getWalletBalance,
  addMoney,
  getWalletTransactions,
  requestWithdrawal,
  getRiderEarnings,
  getPassengerSpending,
  createRazorpayOrder,
  verifyRazorpayPayment
} = require("../controllers/walletController");

const router = express.Router();

router.get(
  "/balance",
  authMiddleware,
  getWalletBalance
);

router.post(
  "/add-money",
  authMiddleware,
  addMoney
);

router.get(
  "/transactions",
  authMiddleware,
  getWalletTransactions
);

router.post(
  "/withdraw",
  authMiddleware,
  requestWithdrawal
);

router.get(
  "/rider-earnings",
  authMiddleware,
  getRiderEarnings
);

router.get(
  "/passenger-spending",
  authMiddleware,
  getPassengerSpending
);

router.post(
  "/create-order",
  authMiddleware,
  createRazorpayOrder
);

router.post(
  "/verify-payment",
  authMiddleware,
  verifyRazorpayPayment
);

module.exports = router;