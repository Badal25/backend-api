const pool = require("../config/db");

const createComplaint = async (req, res) => {
  try {

    const { userId } = req.user;

    const {
      rideId,
      againstUserId,
      complaintText
    } = req.body;

    const rideResult = await pool.query(
      `
      SELECT *
      FROM rides
      WHERE id = $1
      `,
      [rideId]
    );

    if (rideResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO complaints
      (
        ride_id,
        complainant_id,
        against_user_id,
        complaint_text
      )
      VALUES
      ($1,$2,$3,$4)
      RETURNING *
      `,
      [
        rideId,
        userId,
        againstUserId,
        complaintText
      ]
    );

    res.status(201).json({
      success: true,
      complaint: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const getMyComplaints = async (req, res) => {
  try {

    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT *
      FROM complaints
      WHERE complainant_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      complaints: result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  createComplaint,
  getMyComplaints
};