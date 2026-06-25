const pool = require("../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get Wallet Balance
const getWalletBalance = async (req, res) => {
  try {

    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT balance
      FROM wallets
      WHERE user_id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    res.json({
      success: true,
      balance: Number(result.rows[0].balance)
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Add Money
const addMoney = async (req, res) => {
  try {

    const { userId } = req.user;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    const walletResult = await pool.query(
      `
      SELECT *
      FROM wallets
      WHERE user_id = $1
      `,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    const wallet = walletResult.rows[0];

    await pool.query(
      `
      UPDATE wallets
      SET
      balance = balance + $1,
      updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      `,
      [amount, userId]
    );

    await pool.query(
      `
      INSERT INTO wallet_transactions
      (
        wallet_id,
        amount,
        transaction_type,
        description
      )
      VALUES
      (
        $1,
        $2,
        'credit',
        'Money added to wallet'
      )
      `,
      [
        wallet.id,
        amount
      ]
    );

    res.json({
      success: true,
      message: "Money added successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Transaction History
const getWalletTransactions = async (req, res) => {
  try {

    const { userId } = req.user;

    const walletResult = await pool.query(
      `
      SELECT id
      FROM wallets
      WHERE user_id = $1
      `,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    const walletId =
      walletResult.rows[0].id;

    const transactions =
      await pool.query(
        `
        SELECT *
        FROM wallet_transactions
        WHERE wallet_id = $1
        ORDER BY created_at DESC
        `,
        [walletId]
      );

    res.json({
      success: true,
      transactions:
        transactions.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Rider Earnings
const getRiderEarnings = async (req, res) => {
  try {

    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT
      COALESCE(
        SUM(amount),
        0
      ) AS total_earnings
      FROM payments
      WHERE
      rider_id = $1
      AND payment_status = 'success'
      `,
      [userId]
    );

    res.json({
      success: true,
      total_earnings: Number(
        result.rows[0].total_earnings
      )
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Passenger Spending
const getPassengerSpending =
async (req, res) => {
  try {

    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT
      COALESCE(
        SUM(amount),
        0
      ) AS total_spent
      FROM payments
      WHERE
      passenger_id = $1
      AND payment_status = 'success'
      `,
      [userId]
    );

    res.json({
      success: true,
      total_spent: Number(
        result.rows[0].total_spent
      )
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Withdrawal Request
const requestWithdrawal =
async (req, res) => {
  try {

    const { userId } = req.user;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    const walletResult =
      await pool.query(
        `
        SELECT *
        FROM wallets
        WHERE user_id = $1
        `,
        [userId]
      );

    if (
      walletResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    const wallet =
      walletResult.rows[0];

    if (
      Number(wallet.balance)
      < Number(amount)
    ) {
      return res.status(400).json({
        success: false,
        message:
        "Insufficient balance"
      });
    }

    await pool.query(
      `
      INSERT INTO
      withdrawal_requests
      (
        rider_id,
        amount
      )
      VALUES
      ($1,$2)
      `,
      [
        userId,
        amount
      ]
    );

    res.json({
      success: true,
      message:
      "Withdrawal request submitted"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Create Razorpay Order
const createRazorpayOrder =
async (req, res) => {
  try {

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    const order =
    await razorpay.orders.create({
      amount:
      Number(amount) * 100,
      currency: "INR",
      receipt:
      `wallet_${Date.now()}`
    });

    res.json({
      success: true,
      order
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Verify Razorpay Payment
const verifyRazorpayPayment =
async (req, res) => {
  try {

    const { userId } = req.user;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount
    } = req.body;

    const generatedSignature =
    crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        razorpay_order_id +
        "|" +
        razorpay_payment_id
      )
      .digest("hex");

    if (
      generatedSignature !==
      razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
        "Payment verification failed"
      });
    }

    const walletResult =
    await pool.query(
      `
      SELECT *
      FROM wallets
      WHERE user_id = $1
      `,
      [userId]
    );

    if (
      walletResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    const wallet =
    walletResult.rows[0];

    await pool.query(
      `
      UPDATE wallets
      SET
      balance = balance + $1
      WHERE id = $2
      `,
      [
        amount,
        wallet.id
      ]
    );

    await pool.query(
      `
      INSERT INTO
      wallet_transactions
      (
        wallet_id,
        amount,
        transaction_type,
        description
      )
      VALUES
      (
        $1,
        $2,
        'credit',
        'Razorpay Wallet Topup'
      )
      `,
      [
        wallet.id,
        amount
      ]
    );

    res.json({
      success: true,
      message:
      "Wallet credited successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  getWalletBalance,
  addMoney,
  getWalletTransactions,
  requestWithdrawal,
  getRiderEarnings,
  getPassengerSpending,

  createRazorpayOrder,
  verifyRazorpayPayment
};