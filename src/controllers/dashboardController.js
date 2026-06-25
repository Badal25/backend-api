const pool = require("../config/db");

const getDashboard = async (req, res) => {
  try {
    const { userId } = req.user;

    // User Profile
    const profileResult = await pool.query(
      `
      SELECT
      u.id,
      u.full_name,
      u.phone,
      u.enrollment_no,
      u.trust_score,
      u.is_student_verified,
      u.account_status,
      c.college_name
      FROM users u
      LEFT JOIN colleges c
      ON c.id = u.college_id
      WHERE u.id = $1
      `,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Wallet
    const walletResult = await pool.query(
      `
      SELECT balance
      FROM wallets
      WHERE user_id = $1
      `,
      [userId]
    );

    // Rating
    const ratingResult = await pool.query(
      `
      SELECT
      ROUND(
        COALESCE(AVG(rating),0)::numeric,
        1
      ) AS average_rating,

      COUNT(*) AS total_reviews

      FROM ratings
      WHERE receiver_id = $1
      `,
      [userId]
    );

    // Recent Rides
    const ridesResult = await pool.query(
      `
      SELECT
      r.id,
      r.ride_status,
      r.created_at,

      ro.pickup_location,
      ro.drop_location,
      ro.fare_per_seat

      FROM rides r

      JOIN ride_offers ro
      ON r.ride_offer_id = ro.id

      WHERE
      r.rider_id = $1
      OR
      r.passenger_id = $1

      ORDER BY r.created_at DESC
      LIMIT 5
      `,
      [userId]
    );

    // Referral Count
    const referralResult = await pool.query(
      `
      SELECT COUNT(*) AS total_referrals
      FROM referrals
      WHERE referrer_id = $1
      `,
      [userId]
    );

    res.json({
      success: true,

      profile: profileResult.rows[0],

      wallet_balance:
        walletResult.rows.length > 0
          ? Number(walletResult.rows[0].balance)
          : 0,

      rating: {
        average_rating:
          Number(
            ratingResult.rows[0].average_rating
          ) || 0,

        total_reviews:
          Number(
            ratingResult.rows[0].total_reviews
          ) || 0,
      },

      referrals:
        Number(
          referralResult.rows[0]
            .total_referrals
        ) || 0,

      recent_rides:
        ridesResult.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboard,
};