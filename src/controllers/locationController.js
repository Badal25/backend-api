const createNotification =
require("../utils/notificationHelper");

const AVERAGE_SPEED_KMH = 25;
const pool = require("../config/db");

// Update Live Location
const updateLocation = async (req, res) => {
  try {

    const { userId } = req.user;
    const { latitude, longitude } = req.body;

const lat = Number(latitude);
const lng = Number(longitude);

if (
  !Number.isFinite(lat) ||
  !Number.isFinite(lng)
) {
  return res.status(400).json({
    success: false,
    message: "Invalid coordinates"
  });
}

if (
  lat < -90 ||
  lat > 90 ||
  lng < -180 ||
  lng > 180
) {
  return res.status(400).json({
    success: false,
    message: "Coordinates out of range"
  });
}

    const existing = await pool.query(
      `
      SELECT *
      FROM live_locations
      WHERE user_id = $1
      `,
      [userId]
    );

    if (existing.rows.length > 0) {

      await pool.query(
        `
        UPDATE live_locations
        SET
          latitude = $1,
          longitude = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3
        `,
        [latitude, longitude, userId]
      );

    } else {

      await pool.query(
        `
        INSERT INTO live_locations
        (
          user_id,
          latitude,
          longitude
        )
        VALUES
        ($1,$2,$3)
        `,
        [userId, latitude, longitude]
      );

    }

    const io = req.app.get("io");

if (io) {
  io.emit("locationUpdated", {
    userId,
    latitude,
    longitude
  });
}

    res.json({
      success: true,
      message: "Location updated successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Get User Location
const getUserLocation = async (req, res) => {
  try {

    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT
      latitude,
      longitude,
      updated_at
      FROM live_locations
      WHERE user_id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    res.json({
      success: true,
      location: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Track Ride Location
const trackRide = async (req, res) => {
  try {

    const { riderId, passengerId } = req.params;

    const riderLocation = await pool.query(
      `
      SELECT latitude, longitude
      FROM live_locations
      WHERE user_id = $1
      `,
      [riderId]
    );

    const passengerLocation = await pool.query(
      `
      SELECT latitude, longitude
      FROM live_locations
      WHERE user_id = $1
      `,
      [passengerId]
    );

    if (
      riderLocation.rows.length === 0 ||
      passengerLocation.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Location not available"
      });
    }

    res.json({
      success: true,
      rider: riderLocation.rows[0],
      passenger: passengerLocation.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const getRideDistance = async (req, res) => {
  try {

    const { riderId, passengerId } = req.params;

    const result = await pool.query(
      `
      SELECT

      (
        6371 * acos(
          LEAST(
            1,
            GREATEST(
              -1,
              (
                cos(radians(r.latitude))
                * cos(radians(p.latitude))
                * cos(radians(p.longitude) - radians(r.longitude))
                +
                sin(radians(r.latitude))
                * sin(radians(p.latitude))
              )
            )
          )
        )
      ) AS distance_km

      FROM live_locations r
      CROSS JOIN live_locations p

      WHERE
      r.user_id = $1
      AND p.user_id = $2
      `,
      [riderId, passengerId]
    );

if (result.rows.length === 0) {
  return res.status(404).json({
    success: false,
    message: "Location not found"
  });
}

res.json({
  success: true,
  distance_km: Number(
    Number(result.rows[0].distance_km).toFixed(2)
  )
});

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const trackRideByRideId = async (req, res) => {
  try {

    const { rideId } = req.params;

    const rideResult = await pool.query(
      `
      SELECT
      rider_id,
      passenger_id,
      ride_status
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

    const ride = rideResult.rows[0];

    const riderLocation = await pool.query(
      `
      SELECT latitude, longitude, updated_at
      FROM live_locations
      WHERE user_id = $1
      `,
      [ride.rider_id]
    );

    const passengerLocation = await pool.query(
      `
      SELECT latitude, longitude, updated_at
      FROM live_locations
      WHERE user_id = $1
      `,
      [ride.passenger_id]
    );

    if (
  riderLocation.rows.length === 0 ||
  passengerLocation.rows.length === 0
) {
  return res.status(404).json({
    success: false,
    message: "Location not available"
  });
}

    res.json({
      success: true,
      ride_status: ride.ride_status,
      rider: riderLocation.rows[0],
      passenger: passengerLocation.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const updateRideTracking = async (req, res) => {
  try {

    const { rideId } = req.params;

    const rideResult = await pool.query(
      `
      SELECT rider_id, passenger_id
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

    const ride = rideResult.rows[0];

    const result = await pool.query(
      `
      SELECT

      (
        6371 * acos(
          LEAST(
            1,
            GREATEST(
              -1,
              (
                cos(radians(r.latitude))
                * cos(radians(p.latitude))
                * cos(radians(p.longitude) - radians(r.longitude))
                +
                sin(radians(r.latitude))
                * sin(radians(p.latitude))
              )
            )
          )
        )
      ) AS distance_km

      FROM live_locations r
      CROSS JOIN live_locations p

      WHERE
      r.user_id = $1
      AND p.user_id = $2
      `,
      [
        ride.rider_id,
        ride.passenger_id
      ]
    );
if (
  result.rows.length === 0 ||
  result.rows[0].distance_km === null
) {
  return res.status(404).json({
    success: false,
    message: "Live location not found"
  });
}

    const distance =
      Number(result.rows[0].distance_km);

    const eta =
  Math.ceil(
    (distance / AVERAGE_SPEED_KMH) * 60
  );

    await pool.query(
      `
      UPDATE rides
      SET
      estimated_distance_km = $1,
      estimated_time_min = $2
      WHERE id = $3
      `,
      [
        distance,
        eta,
        rideId
      ]
    );

    if (distance <= 0.05) {

  const currentRide = await pool.query(
    `
    SELECT *
    FROM rides
    WHERE id = $1
    `,
    [rideId]
  );

  if (
    currentRide.rows.length > 0 &&
    !currentRide.rows[0].rider_arrived
  ) {

    await pool.query(
      `
      UPDATE rides
      SET rider_arrived = true
      WHERE id = $1
      `,
      [rideId]
    );

    await createNotification(
      ride.passenger_id,
      "Rider Arrived",
      "Your rider has arrived at pickup point."
    );

  }

}

if (result.rows.length === 0) {
  return res.status(404).json({
    success: false,
    message: "Location not found"
  });
}

    res.json({
      success: true,
      distance_km: Number(
  distance.toFixed(2)
),
      eta_minutes: eta,
      rider_arrived: distance <= 0.05
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  updateLocation,
  getUserLocation,
  trackRide,
  getRideDistance,
  trackRideByRideId,
  updateRideTracking
};