const pool = require("../config/db");

const createNotification = async (
  userId,
  title,
  message
) => {

  try {

    await pool.query(
      `
      INSERT INTO notifications
      (
        user_id,
        title,
        message
      )
      VALUES
      ($1,$2,$3)
      `,
      [
        userId,
        title,
        message
      ]
    );

  } catch (error) {

    console.error(
      "Notification Error:",
      error.message
    );

  }

};

module.exports = createNotification;