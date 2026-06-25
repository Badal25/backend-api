const pool = require("../config/db");

// Admin - Get Pending Withdrawals

const getPendingWithdrawals = async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT
        wr.*,
        u.full_name,
        u.phone
      FROM withdrawal_requests wr
      JOIN users u
        ON wr.rider_id = u.id
      WHERE wr.status = 'pending'
      ORDER BY wr.created_at ASC
      `
    );

    res.json({
      success: true,
      withdrawals: result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Admin - Approve Withdrawal

const approveWithdrawal = async (req, res) => {
  try {

    const { withdrawalId } = req.params;

    const requestResult =
      await pool.query(
        `
        SELECT *
        FROM withdrawal_requests
        WHERE id = $1
        `,
        [withdrawalId]
      );

    if (
      requestResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Withdrawal request not found"
      });
    }

    const request =
      requestResult.rows[0];

    if (
      request.status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Already processed"
      });
    }

    const walletResult =
      await pool.query(
        `
        SELECT *
        FROM wallets
        WHERE user_id = $1
        `,
        [request.rider_id]
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
      Number(wallet.balance) <
      Number(request.amount)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Insufficient balance"
      });
    }

    await pool.query(
      `
      UPDATE wallets
      SET
      balance = balance - $1,
      updated_at =
      CURRENT_TIMESTAMP
      WHERE user_id = $2
      `,
      [
        request.amount,
        request.rider_id
      ]
    );

    await pool.query(
      `
      UPDATE withdrawal_requests
      SET status = 'approved'
      WHERE id = $1
      `,
      [withdrawalId]
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
        'debit',
        'Withdrawal Approved'
      )
      `,
      [
        wallet.id,
        request.amount
      ]
    );

    res.json({
      success: true,
      message:
        "Withdrawal approved"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Admin - Reject Withdrawal

const rejectWithdrawal = async (req, res) => {
  try {

    const { withdrawalId } = req.params;

    await pool.query(
      `
      UPDATE withdrawal_requests
      SET status = 'rejected'
      WHERE id = $1
      `,
      [withdrawalId]
    );

    res.json({
      success: true,
      message:
        "Withdrawal rejected"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
};