const pool = require("../config/db");
const {
  sendPushNotification
} = require("./fcmService");

const sendRideNotification =
async (
  userId,
  title,
  message
) => {
  try {

    const result =
    await pool.query(
      `
      SELECT fcm_token
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (
      result.rows.length === 0
    ) {
      return;
    }

    const token =
    result.rows[0].fcm_token;

    if (!token) {
      return;
    }

    await sendPushNotification(
      token,
      title,
      message
    );

  } catch (error) {

    console.error(
      error.message
    );

  }
};

module.exports =
sendRideNotification;