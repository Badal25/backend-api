const pool = require("../config/db");

// Add Vehicle
const addVehicle = async (req, res) => {
  try {
    const { userId } = req.user;

    const {
      vehicle_type,
      vehicle_name,
      vehicle_number,
      rc_url,
      insurance_url
    } = req.body;

    // Check existing vehicle
    const existingVehicle = await pool.query(
      "SELECT * FROM vehicles WHERE vehicle_number = $1",
      [vehicle_number]
    );

    if (existingVehicle.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Vehicle already exists"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO vehicles
      (
        user_id,
        vehicle_type,
        vehicle_name,
        vehicle_number,
        rc_url,
        insurance_url
      )
      VALUES
      ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        userId,
        vehicle_type,
        vehicle_name,
        vehicle_number,
        rc_url,
        insurance_url
      ]
    );

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Apply Rider
const applyForRider = async (req, res) => {

  try {

    const { userId } = req.user;

    const {
      vehicle_id,
      license_url
    } = req.body;

    const existingApplication = await pool.query(
      `
      SELECT *
      FROM rider_verifications
      WHERE user_id = $1
      `,
      [userId]
    );

    if (existingApplication.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Application already submitted"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO rider_verifications
      (
        user_id,
        vehicle_id,
        license_url
      )
      VALUES
      ($1,$2,$3)
      RETURNING *
      `,
      [
        userId,
        vehicle_id,
        license_url
      ]
    );

    res.status(201).json({
      success: true,
      message: "Rider application submitted",
      verification: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

// Status
const getRiderStatus = async (req, res) => {

  try {

    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT *
      FROM rider_verifications
      WHERE user_id = $1
      `,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

// Offer Ride
const offerRide = async (req, res) => {
  try {

    const { userId } = req.user;

    const {
  vehicle_id,
  pickup_location,
  pickup_lat,
  pickup_lng,
  drop_location,
  drop_lat,
  drop_lng,
  departure_time,
  seats_total,
  fare_per_seat,
  female_only
} = req.body;

    // Check rider approved
    const riderCheck = await pool.query(
      `
      SELECT *
      FROM rider_verifications
      WHERE user_id = $1
      AND verification_status = 'approved'
      `,
      [userId]
    );

    if (riderCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Rider not approved"
      });
    }

    // Verify vehicle belongs to rider
    const vehicleCheck = await pool.query(
      `
      SELECT *
      FROM vehicles
      WHERE id = $1
      AND user_id = $2
      `,
      [vehicle_id, userId]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle"
      });
    }

    const result = await pool.query(
  `
  INSERT INTO ride_offers
  (
    rider_id,
    vehicle_id,

    pickup_location,
    pickup_lat,
    pickup_lng,

    drop_location,
    drop_lat,
    drop_lng,

    departure_time,

    seats_total,
    seats_available,

    fare_per_seat,
    female_only
  )
  VALUES
  (
    $1,$2,
    $3,$4,$5,
    $6,$7,$8,
    $9,
    $10,$10,
    $11,$12
  )
  RETURNING *
  `,
  [
    userId,
    vehicle_id,

    pickup_location,
    pickup_lat,
    pickup_lng,

    drop_location,
    drop_lat,
    drop_lng,

    departure_time,

    seats_total,

    fare_per_seat,
    female_only
  ]
);

    res.status(201).json({
      success: true,
      message: "Ride created successfully",
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

// Search Rides
const searchNearbyRides = async (req, res) => {
  try {

    const latitude = parseFloat(req.query.latitude);
    const longitude = parseFloat(req.query.longitude);

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required"
      });
    }

    const result = await pool.query(
      `
      SELECT
        ro.*,
        u.full_name,
        v.vehicle_name,

        (
          6371 * acos(
            LEAST(
              1,
              GREATEST(
                -1,
                (
                  cos(radians($1))
                  * cos(radians(ro.pickup_lat))
                  * cos(radians(ro.pickup_lng) - radians($2))
                  +
                  sin(radians($1))
                  * sin(radians(ro.pickup_lat))
                )
              )
            )
          )
        ) AS distance_km

      FROM ride_offers ro

      JOIN users u
      ON ro.rider_id = u.id

      JOIN vehicles v
      ON ro.vehicle_id = v.id

      WHERE
        ro.ride_status = 'active'
        AND ro.seats_available > 0
        AND ro.pickup_lat IS NOT NULL
        AND ro.pickup_lng IS NOT NULL

      ORDER BY distance_km ASC
      `,
      [latitude, longitude]
    );

    const nearbyRides = result.rows.filter(
      ride => Number(ride.distance_km) <= 1
    );

    res.json({
      success: true,
      total: nearbyRides.length,
      rides: nearbyRides
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const getMyVehicles = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT *
      FROM vehicles
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      vehicles: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addVehicle,
  applyForRider,
  getRiderStatus,
  offerRide,
  searchNearbyRides,
  getMyVehicles
};