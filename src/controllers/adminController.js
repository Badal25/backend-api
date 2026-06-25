const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {

    const totalUsers = await pool.query(`
      SELECT COUNT(*) AS count
      FROM users
    `);

    const totalRiders = await pool.query(`
      SELECT COUNT(*) AS count
      FROM rider_verifications
      WHERE verification_status = 'approved'
    `);

    const totalRides = await pool.query(`
      SELECT COUNT(*) AS count
      FROM rides
    `);

    const completedRides = await pool.query(`
      SELECT COUNT(*) AS count
      FROM rides
      WHERE ride_status = 'completed'
    `);

    const ongoingRides = await pool.query(`
      SELECT COUNT(*) AS count
      FROM rides
      WHERE ride_status = 'ongoing'
    `);

    const cancelledRides = await pool.query(`
      SELECT COUNT(*) AS count
      FROM rides
      WHERE ride_status = 'cancelled'
    `);

    const pendingRiderVerifications =
      await pool.query(`
        SELECT COUNT(*) AS count
        FROM rider_verifications
        WHERE verification_status = 'pending'
      `);

    const pendingComplaints =
      await pool.query(`
        SELECT COUNT(*) AS count
        FROM complaints
        WHERE complaint_status = 'open'
      `);

    const pendingWithdrawals =
      await pool.query(`
        SELECT COUNT(*) AS count
        FROM withdrawal_requests
        WHERE status = 'pending'
      `);

    const totalRevenue =
      await pool.query(`
        SELECT
        COALESCE(
          SUM(amount),
          0
        ) AS revenue
        FROM payments
        WHERE payment_status = 'success'
      `);

    res.json({
      success: true,

      total_users:
        Number(
          totalUsers.rows[0].count
        ),

      total_riders:
        Number(
          totalRiders.rows[0].count
        ),

      total_rides:
        Number(
          totalRides.rows[0].count
        ),

      completed_rides:
        Number(
          completedRides.rows[0].count
        ),

      ongoing_rides:
        Number(
          ongoingRides.rows[0].count
        ),

      cancelled_rides:
        Number(
          cancelledRides.rows[0].count
        ),

      pending_rider_verifications:
        Number(
          pendingRiderVerifications
          .rows[0].count
        ),

      pending_complaints:
        Number(
          pendingComplaints
          .rows[0].count
        ),

      pending_withdrawals:
        Number(
          pendingWithdrawals
          .rows[0].count
        ),

      total_revenue:
        Number(
          totalRevenue.rows[0].revenue
        )

    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const getPendingRiders = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
      rv.id,
      rv.user_id,
      rv.vehicle_id,
      rv.license_url,
      rv.created_at,
      u.full_name,
      u.phone
      FROM rider_verifications rv
      JOIN users u
      ON rv.user_id = u.id
      WHERE rv.verification_status = 'pending'
      ORDER BY rv.created_at ASC
    `);

    res.json({
      success: true,
      riders: result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const approveRider = async (req, res) => {
  try {

    const { verificationId } = req.params;

    await pool.query(
      `
      UPDATE rider_verifications
      SET
      verification_status = 'approved',
      verified_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [verificationId]
    );

    res.json({
      success: true,
      message: "Rider approved successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const rejectRider = async (req, res) => {
  try {

    const { verificationId } = req.params;

    await pool.query(
      `
      UPDATE rider_verifications
      SET
      verification_status = 'rejected',
      verified_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [verificationId]
    );

    res.json({
      success: true,
      message: "Rider rejected successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const getAllComplaints = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
      c.*,
      u1.full_name AS complainant_name,
      u2.full_name AS against_user_name
      FROM complaints c
      JOIN users u1
      ON c.complainant_id = u1.id
      JOIN users u2
      ON c.against_user_id = u2.id
      ORDER BY c.created_at DESC
    `);

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

const resolveComplaint = async (req, res) => {
  try {

    const { complaintId } = req.params;

    const result = await pool.query(
      `
      UPDATE complaints
      SET complaint_status = 'resolved'
      WHERE id = $1
      RETURNING *
      `,
      [complaintId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    res.json({
      success: true,
      message: "Complaint resolved"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const closeComplaint = async (req, res) => {
  try {

    const { complaintId } = req.params;

    const result = await pool.query(
      `
      UPDATE complaints
      SET complaint_status = 'closed'
      WHERE id = $1
      RETURNING *
      `,
      [complaintId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    res.json({
      success: true,
      message: "Complaint closed"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const getPendingWithdrawals = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
      wr.*,
      u.full_name,
      u.phone
      FROM withdrawal_requests wr
      JOIN users u
      ON wr.rider_id = u.id
      WHERE wr.status = 'pending'
      ORDER BY wr.created_at ASC
    `);

    res.json({
      success: true,
      withdrawals: result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const approveWithdrawal = async (req, res) => {
  try {

    const { withdrawalId } = req.params;

    const withdrawalResult = await pool.query(
      `
      SELECT *
      FROM withdrawal_requests
      WHERE id = $1
      `,
      [withdrawalId]
    );

    if (withdrawalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found"
      });
    }

    const withdrawal =
      withdrawalResult.rows[0];

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Already processed"
      });
    }

    const walletResult =
      await pool.query(
        `
        SELECT *
        FROM wallets
        WHERE user_id = $1
        `,
        [withdrawal.rider_id]
      );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    const wallet =
      walletResult.rows[0];

    if (
      Number(wallet.balance)
      < Number(withdrawal.amount)
    ) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    await pool.query(
      `
      UPDATE wallets
      SET
      balance = balance - $1,
      updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      `,
      [
        withdrawal.amount,
        withdrawal.rider_id
      ]
    );

    await pool.query(
      `
      INSERT INTO wallet_transactions
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
        'Withdrawal Approved'
      )
      `,
      [
        wallet.id,
        withdrawal.amount
      ]
    );

    await pool.query(
      `
      UPDATE withdrawal_requests
      SET status = 'approved'
      WHERE id = $1
      `,
      [withdrawalId]
    );

    res.json({
      success: true,
      message: "Withdrawal approved"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const rejectWithdrawal = async (req, res) => {
  try {

    const { withdrawalId } = req.params;

    const result = await pool.query(
      `
      UPDATE withdrawal_requests
      SET status = 'rejected'
      WHERE id = $1
      RETURNING *
      `,
      [withdrawalId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found"
      });
    }

    res.json({
      success: true,
      message: "Withdrawal rejected"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Get All Users

const getAllUsers = async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT
      id,
      full_name,
      phone,
      account_status,
      trust_score,
      is_student_verified,
      created_at
      FROM users
      ORDER BY created_at DESC
      `
    );

    res.json({
      success: true,
      users: result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const suspendUser = async (req, res) => {
  try {

    const { userId } = req.params;

    const result = await pool.query(
      `
      UPDATE users
      SET account_status='suspended'
      WHERE id=$1
      RETURNING *
      `,
      [userId]
    );

    if(result.rows.length === 0){
      return res.status(404).json({
        success:false,
        message:"User not found"
      });
    }

    res.json({
      success:true,
      message:"User suspended"
    });

  } catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

const banUser = async (req, res) => {
  try {

    const { userId } = req.params;

    const result = await pool.query(
      `
      UPDATE users
      SET account_status='banned'
      WHERE id=$1
      RETURNING *
      `,
      [userId]
    );

    if(result.rows.length === 0){
      return res.status(404).json({
        success:false,
        message:"User not found"
      });
    }

    res.json({
      success:true,
      message:"User banned"
    });

  } catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

const activateUser = async (req, res) => {
  try {

    const { userId } = req.params;

    const result = await pool.query(
      `
      UPDATE users
      SET account_status='active'
      WHERE id=$1
      RETURNING *
      `,
      [userId]
    );

    if(result.rows.length === 0){
      return res.status(404).json({
        success:false,
        message:"User not found"
      });
    }

    res.json({
      success:true,
      message:"User activated"
    });

  } catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

// Get All Rides
const getAllRides = async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.ride_status,
        r.created_at,
        r.started_at,
        r.completed_at,

        rider.id AS rider_id,
        rider.full_name AS rider_name,

        passenger.id AS passenger_id,
        passenger.full_name AS passenger_name

      FROM rides r

      JOIN users rider
      ON r.rider_id = rider.id

      JOIN users passenger
      ON r.passenger_id = passenger.id

      ORDER BY r.created_at DESC
      `
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

// Get All Active/Ongoing Rides
const getActiveRides = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
        r.*,
        rider.full_name AS rider_name,
        passenger.full_name AS passenger_name
      FROM rides r
      JOIN users rider
        ON rider.id = r.rider_id
      JOIN users passenger
        ON passenger.id = r.passenger_id
      WHERE r.ride_status IN ('scheduled','ongoing')
      ORDER BY r.created_at DESC
    `);

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

// Get Ride Details
const getRideById = async (req, res) => {
  try {

    const { rideId } = req.params;

    const result = await pool.query(`
      SELECT *
      FROM rides
      WHERE id = $1
    `,[rideId]);

    if(result.rows.length === 0){
      return res.status(404).json({
        success:false,
        message:"Ride not found"
      });
    }

    res.json({
      success:true,
      ride:result.rows[0]
    });

  } catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

// Admin Cancel Ride
const adminCancelRide = async (req, res) => {
  try {

    const { rideId } = req.params;

    await pool.query(`
      UPDATE rides
      SET
        ride_status = 'cancelled',
        cancelled_reason = 'Cancelled by Admin',
        cancelled_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,[rideId]);

    res.json({
      success:true,
      message:"Ride cancelled successfully"
    });

  } catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

// Get Active SOS Cases
const getActiveSOS = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT *
      FROM sos_logs
      ORDER BY created_at DESC
    `);

    res.json({
      success:true,
      sos:result.rows
    });

  } catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

// Analytics Dashboard

const getAnalytics = async (req, res) => {
  try {

    const totalUsers = await pool.query(`
      SELECT COUNT(*) AS count
      FROM users
    `);

    const totalRiders = await pool.query(`
      SELECT COUNT(*) AS count
      FROM rider_verifications
      WHERE verification_status = 'approved'
    `);

    const totalRides = await pool.query(`
      SELECT COUNT(*) AS count
      FROM rides
    `);

    const completedRides = await pool.query(`
      SELECT COUNT(*) AS count
      FROM rides
      WHERE ride_status = 'completed'
    `);

    const cancelledRides = await pool.query(`
      SELECT COUNT(*) AS count
      FROM rides
      WHERE ride_status = 'cancelled'
    `);

    const totalRevenue = await pool.query(`
      SELECT COALESCE(SUM(amount),0) AS revenue
      FROM payments
      WHERE payment_status = 'success'
    `);

    res.json({
      success: true,
      analytics: {
        totalUsers: Number(totalUsers.rows[0].count),
        totalRiders: Number(totalRiders.rows[0].count),
        totalRides: Number(totalRides.rows[0].count),
        completedRides: Number(completedRides.rows[0].count),
        cancelledRides: Number(cancelledRides.rows[0].count),
        totalRevenue: Number(totalRevenue.rows[0].revenue)
      }
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const getMonthlyAnalytics = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
      DATE_TRUNC('month', created_at) AS month,
      COUNT(*) AS rides
      FROM rides
      GROUP BY month
      ORDER BY month
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


module.exports = {
  getDashboardStats,
  getPendingRiders,
  approveRider,
  rejectRider,
  getAllComplaints,
  resolveComplaint,
  closeComplaint,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getAllUsers,
  suspendUser,
  banUser,
  activateUser,
  getAllRides,
  getActiveRides,
getRideById,
adminCancelRide,
getActiveSOS,
getAnalytics,
getMonthlyAnalytics

};