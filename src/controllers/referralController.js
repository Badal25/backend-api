const pool = require("../config/db");

// Get My Referral Code
const getReferralCode = async (req, res) => {
  try {

    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT referral_code
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    res.json({
      success: true,
      referral_code:
      result.rows[0].referral_code
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Apply Referral Code
const applyReferralCode = async (
  req,
  res
) => {
  try {

    const { userId } = req.user;

    const { referral_code } =
    req.body;

    const userResult =
    await pool.query(
      `
      SELECT *
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    const user =
    userResult.rows[0];

    if (user.referred_by) {
      return res.status(400).json({
        success: false,
        message:
        "Referral already applied"
      });
    }

    const referrerResult =
    await pool.query(
      `
      SELECT *
      FROM users
      WHERE referral_code = $1
      `,
      [referral_code]
    );

    if (
      referrerResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
        "Invalid referral code"
      });
    }

    const referrer =
    referrerResult.rows[0];

    if (referrer.id === userId) {
      return res.status(400).json({
        success: false,
        message:
        "Cannot refer yourself"
      });
    }

    await pool.query(
      `
      UPDATE users
      SET referred_by = $1
      WHERE id = $2
      `,
      [
        referrer.id,
        userId
      ]
    );

    await pool.query(
      `
      INSERT INTO referrals
      (
        referrer_id,
        referred_user_id
      )
      VALUES
      ($1,$2)
      `,
      [
        referrer.id,
        userId
      ]
    );

    res.json({
      success: true,
      message:
      "Referral applied successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Referral History
const getReferralHistory =
async (req, res) => {
  try {

    const { userId } = req.user;

    const result =
    await pool.query(
      `
      SELECT
      r.*,
      u.full_name
      FROM referrals r
      JOIN users u
      ON r.referred_user_id = u.id
      WHERE r.referrer_id = $1
      ORDER BY r.created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      referrals:
      result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  getReferralCode,
  applyReferralCode,
  getReferralHistory
};