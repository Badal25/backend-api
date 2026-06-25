const pool = require("../config/db");

const getUserStatus = async (req, res) => {
  try {

    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT
      is_online,
      last_seen
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      status: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const saveFCMToken = async (req, res) => {
  try {

    const { userId } = req.user;
    const { fcm_token } = req.body;

    if (!fcm_token) {
      return res.status(400).json({
        success: false,
        message: "FCM token required"
      });
    }

    await pool.query(
      `
      UPDATE users
      SET fcm_token = $1
      WHERE id = $2
      `,
      [fcm_token, userId]
    );

    res.json({
      success: true,
      message: "FCM token saved"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  getUserStatus,
  saveFCMToken
};