const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// Create Tracking Link
const createTrackingLink = async (req, res) => {
  try {

    const { rideId } = req.params;

    const token = uuidv4();

    const expiryDate = new Date();
    expiryDate.setHours(
      expiryDate.getHours() + 24
    );

    await pool.query(
      `
      INSERT INTO ride_tracking_links
      (
        ride_id,
        tracking_token,
        expires_at
      )
      VALUES
      ($1,$2,$3)
      `,
      [
        rideId,
        token,
        expiryDate
      ]
    );

    res.json({
      success: true,
      tracking_link:
      `http://localhost:5000/api/tracking/${token}`
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Public Tracking API
const getTrackingDetails = async (req, res) => {
  try {

    const { token } = req.params;

    const result = await pool.query(
      `
      SELECT

      rtl.expires_at,

      r.id,
      r.ride_status,
      r.current_lat,
      r.current_lng,
      r.estimated_distance_km,
      r.estimated_time_min,

      rider.full_name
      AS rider_name,

      passenger.full_name
      AS passenger_name

      FROM ride_tracking_links rtl

      JOIN rides r
      ON rtl.ride_id = r.id

      JOIN users rider
      ON rider.id = r.rider_id

      JOIN users passenger
      ON passenger.id = r.passenger_id

      WHERE rtl.tracking_token = $1
      `,
      [token]
    );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
        "Tracking link not found"
      });
    }

    const tracking =
    result.rows[0];

    if (
      new Date() >
      new Date(
        tracking.expires_at
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
        "Tracking link expired"
      });
    }

    res.json({
      success: true,
      tracking
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  createTrackingLink,
  getTrackingDetails
};