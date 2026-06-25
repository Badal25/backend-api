const pool = require("../config/db");

// Give Rating
const giveRating = async (req, res) => {
  try {

    const { userId } = req.user;

    const {
      ride_id,
      receiver_id,
      rating,
      review
    } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const rideResult = await pool.query(
      `
      SELECT *
      FROM rides
      WHERE id = $1
      `,
      [ride_id]
    );

    if (rideResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

    const ride = rideResult.rows[0];

    if (ride.ride_status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: "Ride not completed yet"
      });
    }

    if (
      userId !== ride.rider_id &&
      userId !== ride.passenger_id
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const alreadyRated = await pool.query(
      `
      SELECT *
      FROM ratings
      WHERE ride_id = $1
      AND giver_id = $2
      `,
      [ride_id, userId]
    );

    if (alreadyRated.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You already rated this ride"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO ratings
      (
        ride_id,
        giver_id,
        receiver_id,
        rating,
        review
      )
      VALUES
      ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [
        ride_id,
        userId,
        receiver_id,
        rating,
        review
      ]
    );

    const averageRating = await pool.query(
`
SELECT
ROUND(
  AVG(rating)::numeric,
  2
) AS trust_score
FROM ratings
WHERE receiver_id = $1
`,
[receiverId]
);

await pool.query(
`
UPDATE users
SET trust_score = $1
WHERE id = $2
`,
[
  averageRating.rows[0].trust_score,
  receiverId
]
);

    res.json({
      success: true,
      message: "Rating submitted successfully",
      rating: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Get User Rating
const getUserRating = async (req, res) => {
  try {

    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT
      ROUND(AVG(rating)::numeric,1)
      AS average_rating,

      COUNT(*)
      AS total_reviews

      FROM ratings
      WHERE receiver_id = $1
      `,
      [userId]
    );

    res.json({
      success: true,
      average_rating:
        result.rows[0].average_rating || 0,
      total_reviews:
        result.rows[0].total_reviews || 0
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  giveRating,
  getUserRating
};