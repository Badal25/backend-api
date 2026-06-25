const pool = require("../config/db");

const getActiveRide = async (req, res) => {
  try {

    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT

      r.id AS ride_id,
      r.ride_status,
      r.rider_arrived,
      r.passenger_boarded,

      r.current_lat,
      r.current_lng,

      r.estimated_distance_km,
      r.estimated_time_min,

      ro.pickup_location,
      ro.drop_location,
      ro.departure_time,
      ro.fare_per_seat,

      rider.id AS rider_id,
      rider.full_name AS rider_name,
      rider.phone AS rider_phone,
      rider.trust_score AS rider_trust_score,

      passenger.id AS passenger_id,
      passenger.full_name AS passenger_name,
      passenger.phone AS passenger_phone,

      v.vehicle_name,
      v.vehicle_number

      FROM rides r

      JOIN ride_offers ro
      ON r.ride_offer_id = ro.id

      JOIN users rider
      ON r.rider_id = rider.id

      JOIN users passenger
      ON r.passenger_id = passenger.id

      LEFT JOIN vehicles v
      ON ro.vehicle_id = v.id

      WHERE
      (
        r.rider_id = $1
        OR
        r.passenger_id = $1
      )
      AND
      r.ride_status IN
      (
        'scheduled',
        'otp_pending',
        'ongoing'
      )

      ORDER BY r.created_at DESC
      LIMIT 1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active ride found"
      });
    }

    res.json({
      success: true,
      ride: result.rows[0]
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
  getActiveRide
};