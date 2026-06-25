const pool = require("../config/db");

const findMatchingRides = async (req, res) => {
  try {

    const { pickup, drop } = req.query;

    if (!pickup || !drop) {
      return res.status(400).json({
        success: false,
        message: "Pickup and drop required"
      });
    }

    const result = await pool.query(
      `
      SELECT
        ro.*,
        u.full_name,
        u.trust_score
      FROM ride_offers ro
      JOIN users u
        ON ro.rider_id = u.id
      WHERE
        ro.pickup_location ILIKE $1
        AND ro.drop_location ILIKE $2
        AND ro.seats_available > 0
        AND ro.ride_status = 'active'
      ORDER BY
        u.trust_score DESC,
        ro.fare_per_seat ASC,
        ro.departure_time ASC

        CASE
WHEN ro.departure_time > NOW()
THEN 0
ELSE 1
END
      `,
      [
        `%${pickup}%`,
        `%${drop}%`
      ]
    );

    res.json({
      success: true,
      total_matches: result.rows.length,
      rides: result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// This function finds nearby rides based on the provided pickup latitude and longitude. It calculates the distance using the Haversine formula and returns the closest rides that are active and have available seats.
const findNearbyRides = async (req, res) => {
  try {

    const {
      pickup_lat,
      pickup_lng
    } = req.query;

    if (!pickup_lat || !pickup_lng) {
      return res.status(400).json({
        success: false,
        message: "Location required"
      });
    }

    const result = await pool.query(
      `
      SELECT
        ro.*,
        u.full_name,
        u.trust_score,

        (
          6371 *
          acos(
            cos(radians($1))
            *
            cos(radians(ro.pickup_lat))
            *
            cos(
              radians(ro.pickup_lng)
              - radians($2)
            )
            +
            sin(radians($1))
            *
            sin(radians(ro.pickup_lat))
          )
        ) AS distance_km

      FROM ride_offers ro

      JOIN users u
      ON ro.rider_id = u.id

      WHERE
        ro.ride_status = 'active'
        AND ro.seats_available > 0

      ORDER BY distance_km ASC

      LIMIT 20
      `,
      [
        pickup_lat,
        pickup_lng
      ]
    );

    res.json({
      success: true,
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
  findMatchingRides,
  findNearbyRides
};