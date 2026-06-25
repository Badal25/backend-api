const pool = require("../config/db");

const getRideHistory = async (req, res) => {
  try {

    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT

      r.id,
      r.ride_status,
      r.started_at,
      r.completed_at,
      r.created_at,

      ro.pickup_location,
      ro.drop_location,
      ro.departure_time,
      ro.fare_per_seat,

      rider.full_name AS rider_name,
      passenger.full_name AS passenger_name

      FROM rides r

      JOIN ride_offers ro
      ON r.ride_offer_id = ro.id

      JOIN users rider
      ON r.rider_id = rider.id

      JOIN users passenger
      ON r.passenger_id = passenger.id

      WHERE
      (
        r.rider_id = $1
        OR
        r.passenger_id = $1
      )

      AND
      r.ride_status IN
      (
        'completed',
        'cancelled'
      )

      ORDER BY r.created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      total_rides: result.rows.length,
      rides: result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  getRideHistory
};