const createNotification = require("../utils/notificationHelper");
const sendRideNotification = require("../services/sendRideNotification");

const pool = require("../config/db");

// Request Ride
const requestRide = async (req, res) => {
  try {

    const { userId } = req.user;

    const { ride_offer_id } = req.body;

    // Check ride exists
    const rideResult = await pool.query(
      `
      SELECT *
      FROM ride_offers
      WHERE id = $1
      AND ride_status = 'active'
      `,
      [ride_offer_id]
    );

    if (rideResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

    const ride = rideResult.rows[0];

    // Seats available?
    if (ride.seats_available <= 0) {
      return res.status(400).json({
        success: false,
        message: "No seats available"
      });
    }

    // Prevent rider requesting own ride
    if (ride.rider_id === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot request your own ride"
      });
    }

    // Duplicate request check
    const existingRequest = await pool.query(
      `
      SELECT *
      FROM ride_requests
      WHERE ride_offer_id = $1
      AND passenger_id = $2
      `,
      [ride_offer_id, userId]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ride request already sent"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO ride_requests
      (
        ride_offer_id,
        passenger_id
      )
      VALUES
      ($1,$2)
      RETURNING *
      `,
      [
        ride_offer_id,
        userId
      ]
    );

    await createNotification(
  ride.rider_id,
  "New Ride Request",
  "You have received a new ride request."
);

    res.status(201).json({
      success: true,
      message: "Ride request sent successfully",
      request: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Accept Ride Request
const acceptRideRequest = async (req, res) => {
  try {

    const { userId } = req.user;

    const { request_id } = req.body;

    const requestResult = await pool.query(
      `
      SELECT
  rr.*,
  ro.rider_id,
  ro.seats_available,
  ro.id AS ride_offer_id,
  ro.fare_per_seat
FROM ride_requests rr
JOIN ride_offers ro
  ON rr.ride_offer_id = ro.id
WHERE rr.id = $1
      `,
      [request_id]
    );

    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    const request = requestResult.rows[0];

    // Only ride owner can accept
    if (request.rider_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (request.request_status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed"
      });
    }

    if (request.seats_available <= 0) {
      return res.status(400).json({
        success: false,
        message: "No seats available"
      });
    }

    // Generate OTPs
    const startOtp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const endOtp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Create actual ride
    const rideResult = await pool.query(
      `
      INSERT INTO rides
(
  ride_offer_id,
  rider_id,
  passenger_id,
  start_otp,
  end_otp,
  fare_amount,
  payment_status
)
VALUES
($1,$2,$3,$4,$5,$6,'pending')
RETURNING *
      `,
      [
  request.ride_offer_id,
  request.rider_id,
  request.passenger_id,
  startOtp,
  endOtp,
  request.fare_per_seat
]
    );

    // Approve request
    await pool.query(
      `
      UPDATE ride_requests
      SET request_status='accepted'
      WHERE id=$1
      `,
      [request_id]
    );

    // Reduce seat
    await pool.query(
      `
      UPDATE ride_offers
      SET seats_available = seats_available - 1
      WHERE id=$1
      `,
      [request.ride_offer_id]
    );

    await createNotification(
  request.passenger_id,
  "Ride Accepted",
  "Your ride request has been accepted."
);

await sendRideNotification(
  request.passenger_id,
  "Ride Accepted",
  "Your ride request has been accepted."
);

    res.json({
      success: true,
      message: "Ride request accepted",
      ride: rideResult.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Reject Ride Request

const rejectRideRequest = async (req, res) => {
  try {

    const { userId } = req.user;

    const { request_id } = req.body;

    const requestResult = await pool.query(
      `
      SELECT
        rr.*,
        ro.rider_id
      FROM ride_requests rr
      JOIN ride_offers ro
      ON rr.ride_offer_id = ro.id
      WHERE rr.id = $1
      `,
      [request_id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    const request = requestResult.rows[0];

    if (request.rider_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    await pool.query(
      `
      UPDATE ride_requests
      SET request_status='rejected'
      WHERE id=$1
      `,
      [request_id]
    );
await createNotification(
  request.passenger_id,
  "Ride Rejected",
  "Your ride request has been rejected."
);

    res.json({
      success: true,
      message: "Request rejected"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const getIncomingRequests = async (req, res) => {
  try {

    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT
        rr.*,
        u.full_name,
        u.phone,
        ro.pickup_location,
        ro.drop_location
      FROM ride_requests rr
      JOIN users u
      ON rr.passenger_id = u.id
      JOIN ride_offers ro
      ON rr.ride_offer_id = ro.id
      WHERE ro.rider_id = $1
      ORDER BY rr.requested_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      requests: result.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Verify start OTP and start ride
const verifyStartOtp = async (req, res) => {
  try {

    const { ride_id, otp } = req.body;

    const result = await pool.query(
      `
      SELECT *
      FROM rides
      WHERE id = $1
      `,
      [ride_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

    const ride = result.rows[0];

    if (ride.ride_status !== "otp_pending") {
      return res.status(400).json({
        success: false,
        message: "Ride already started"
      });
    }

    if (ride.start_otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    await pool.query(
      `
      UPDATE rides
      SET
        ride_status='ongoing',
        started_at=CURRENT_TIMESTAMP
      WHERE id=$1
      `,
      [ride_id]
    );

    await createNotification(
  ride.rider_id,
  "Ride Started",
  "Ride has started successfully."
);

await createNotification(
  ride.passenger_id,
  "Ride Started",
  "Ride has started successfully."
);

await sendRideNotification(
  ride.passenger_id,
  "Ride Started",
  "Your ride has started."
);

await sendRideNotification(
  ride.rider_id,
  "Ride Started",
  "Ride started successfully."
);

    res.json({
      success: true,
      message: "Ride started successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Verify end OTP and complete ride

const verifyEndOtp = async (req, res) => {
  try {

    const { ride_id, otp } = req.body;

    const result = await pool.query(
      `
      SELECT *
      FROM rides
      WHERE id = $1
      `,
      [ride_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

    const ride = result.rows[0];

    if (ride.ride_status !== "ongoing") {
      return res.status(400).json({
        success: false,
        message: "Ride not active"
      });
    }

    if (ride.end_otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    await pool.query(
      `
      UPDATE rides
      SET
        ride_status='completed',
        completed_at=CURRENT_TIMESTAMP
      WHERE id=$1
      `,
      [ride_id]
    );

    await pool.query(
  `
  UPDATE ride_offers
  SET ride_status='completed'
  WHERE id=$1
  `,
  [ride.ride_offer_id]
);

await pool.query(
  `
  UPDATE ride_requests
  SET request_status='completed'
  WHERE ride_offer_id=$1
  AND passenger_id=$2
  `,
  [
    ride.ride_offer_id,
    ride.passenger_id
  ]
);

// =======================
// WALLET PAYMENT SYSTEM
// =======================

const fareAmount =
  Number(ride.fare_amount || 0);

if (fareAmount > 0) {

  const passengerWallet =
  await pool.query(
    `
    SELECT *
    FROM wallets
    WHERE user_id = $1
    `,
    [ride.passenger_id]
  );

  const riderWallet =
  await pool.query(
    `
    SELECT *
    FROM wallets
    WHERE user_id = $1
    `,
    [ride.rider_id]
  );

  if (
    passengerWallet.rows.length > 0 &&
    riderWallet.rows.length > 0
  ) {

    const passengerBalance =
      Number(
        passengerWallet.rows[0].balance
      );

    if (
      passengerBalance >= fareAmount
    ) {

      // Deduct passenger balance

      await pool.query(
        `
        UPDATE wallets
        SET
        balance = balance - $1,
        updated_at =
        CURRENT_TIMESTAMP
        WHERE user_id = $2
        `,
        [
          fareAmount,
          ride.passenger_id
        ]
      );

      // Add rider balance

      await pool.query(
        `
        UPDATE wallets
        SET
        balance = balance + $1,
        updated_at =
        CURRENT_TIMESTAMP
        WHERE user_id = $2
        `,
        [
          fareAmount,
          ride.rider_id
        ]
      );

      // Passenger transaction

      await pool.query(
        `
        INSERT INTO
        wallet_transactions
        (
          wallet_id,
          amount,
          transaction_type,
          description
        )
        VALUES
        (
          $1,
          $2,
          'debit',
          'Ride Payment'
        )
        `,
        [
          passengerWallet.rows[0].id,
          fareAmount
        ]
      );

      // Rider transaction

      await pool.query(
        `
        INSERT INTO
        wallet_transactions
        (
          wallet_id,
          amount,
          transaction_type,
          description
        )
        VALUES
        (
          $1,
          $2,
          'credit',
          'Ride Earnings'
        )
        `,
        [
          riderWallet.rows[0].id,
          fareAmount
        ]
      );

      // Payment record

      await pool.query(
        `
        INSERT INTO payments
        (
          ride_id,
          passenger_id,
          rider_id,
          amount,
          payment_status,
          payment_method
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          'success',
          'wallet'
        )
        `,
        [
          ride.id,
          ride.passenger_id,
          ride.rider_id,
          fareAmount
        ]
      );

      // Update ride payment status

      await pool.query(
        `
        UPDATE rides
        SET payment_status='success'
        WHERE id=$1
        `,
        [ride.id]
      );

    } else {

      await pool.query(
        `
        UPDATE rides
        SET payment_status='failed'
        WHERE id=$1
        `,
        [ride.id]
      );

    }

  }

}

await createNotification(
  ride.rider_id,
  "Ride Completed",
  "Ride completed successfully."
);

await createNotification(
  ride.passenger_id,
  "Ride Completed",
  "Ride completed successfully."
);

await sendRideNotification(
  ride.passenger_id,
  "Ride Completed",
  "Ride completed successfully."
);

await sendRideNotification(
  ride.rider_id,
  "Ride Completed",
  "Payment credited successfully."
);
    res.json({
      success: true,
      message: "Ride completed successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// rider arrived at pickup location - set ride_status to otp_pending

const riderArrived = async (req, res) => {
  try {

    const { ride_id } = req.body;

    const result = await pool.query(
      `
      UPDATE rides
      SET ride_status='otp_pending'
      WHERE id=$1
      RETURNING *
      `,
      [ride_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

    const ride = result.rows[0];

    await createNotification(
      ride.passenger_id,
      "Rider Arrived",
      "Your rider has arrived. Please share your Start OTP."
    );

    res.json({
      success: true,
      message: "Rider arrived at pickup location",
      ride
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// Get my rides with rider/passenger details (both as rider and passenger)
const getMyRides = async (req, res) => {
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
        ro.fare_per_seat,
        ro.departure_time,

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
      r.rider_id = $1
      OR r.passenger_id = $1

      ORDER BY r.created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      total: result.rows.length,
      rides: result.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Get ride details by ride ID with rider/passenger details
const getRideDetails = async (req, res) => {
  try {

    const { rideId } = req.params;

    const result = await pool.query(
      `
      SELECT

      r.id,
      r.ride_status,
      r.started_at,
      r.completed_at,

      ro.pickup_location,
      ro.drop_location,
      ro.departure_time,
      ro.fare_per_seat,

      rider.id AS rider_id,
      rider.full_name AS rider_name,
      rider.phone AS rider_phone,

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

      WHERE r.id = $1
      `,
      [rideId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
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


// Get live location of rider and passenger for a ride
const getRideProgress = async (req, res) => {
  try {

    const { rideId } = req.params;

    const result = await pool.query(
      `
      SELECT
      ride_status,
      rider_arrived,
      passenger_boarded,
      estimated_distance_km,
      estimated_time_min
      FROM rides
      WHERE id=$1
      `,
      [rideId]
    );

    if(result.rows.length===0){
      return res.status(404).json({
        success:false,
        message:"Ride not found"
      });
    }

    res.json({
      success:true,
      progress:result.rows[0]
    });

  } catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

// Cancel ride (by rider or passenger) with reason and notify other party
const cancelRide = async (req, res) => {
  try {

    const { userId } = req.user;

    const {
      ride_id,
      reason
    } = req.body;

    const result = await pool.query(
      `
      SELECT *
      FROM rides
      WHERE id = $1
      `,
      [ride_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

    const ride = result.rows[0];

    if (
      ride.rider_id !== userId &&
      ride.passenger_id !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (
      ride.ride_status === "completed" ||
      ride.ride_status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Ride already completed/cancelled"
      });
    }

    await pool.query(
      `
      UPDATE rides
      SET
      ride_status = 'cancelled',
      cancelled_by = $1,
      cancelled_reason = $2,
      cancelled_at = CURRENT_TIMESTAMP
      WHERE id = $3
      `,
      [
        userId,
        reason,
        ride_id
      ]
    );

    await pool.query(
      `
      UPDATE ride_requests
      SET request_status='cancelled'
      WHERE ride_offer_id = $1
      AND passenger_id = $2
      `,
      [
        ride.ride_offer_id,
        ride.passenger_id
      ]
    );

    await pool.query(
      `
      UPDATE ride_offers
      SET seats_available =
      seats_available + 1
      WHERE id = $1
      `,
      [ride.ride_offer_id]
    );

    const otherUser =
      ride.rider_id === userId
        ? ride.passenger_id
        : ride.rider_id;

    await createNotification(
      otherUser,
      "Ride Cancelled",
      reason || "Ride has been cancelled."
    );

    res.json({
      success: true,
      message: "Ride cancelled successfully"
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
  requestRide,
  acceptRideRequest,
  rejectRideRequest,
  getIncomingRequests,
  verifyStartOtp,
  verifyEndOtp,
  riderArrived,
  getMyRides,
  getRideDetails,
  getRideProgress,
  cancelRide
};