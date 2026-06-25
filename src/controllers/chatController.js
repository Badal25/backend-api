const pool = require("../config/db");

const getRideMessages = async (req, res) => {
  try {

    const { rideId } = req.params;

    const result = await pool.query(
      `
      SELECT

      rm.*,
      u.full_name

      FROM ride_messages rm

      JOIN users u
      ON rm.sender_id = u.id

      WHERE rm.ride_id = $1

      ORDER BY rm.created_at ASC
      `,
      [rideId]
    );

    res.json({
      success: true,
      messages: result.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  getRideMessages
};