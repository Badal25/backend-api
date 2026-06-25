const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const TEMP_OTP = "123456";

// Send OTP
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    return res.json({
      success: true,
      message: "OTP sent successfully",
      otp: TEMP_OTP,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Phone validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // OTP validation
    if (otp !== TEMP_OTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const userResult = await pool.query(
      "SELECT * FROM users WHERE phone = $1",
      [phone]
    );

    const user = userResult.rows[0];

    const token = jwt.sign(
      {
        phone,
        userId: user?.id || null,
      },
      process.env.JWT_SECRET || "CollegeRideSecretKey2026",
      {
        expiresIn: "7d",
      }
    );

    if (user) {
      await pool.query(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
        [user.id]
      );

      return res.json({
        success: true,
        isNewUser: false,
        token,
        user,
      });
    }

    return res.json({
      success: true,
      isNewUser: true,
      token,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Complete Profile
const completeProfile = async (req, res) => {
  try {
    const {
      full_name,
      phone,
      gender,
      college_id,
      enrollment_no,
    } = req.body;

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE phone = $1",
      [phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO users
      (
        full_name,
        phone,
        gender,
        college_id,
        enrollment_no,
        is_profile_completed
      )
      VALUES
      ($1,$2,$3,$4,$5,true)
      RETURNING *
      `,
      [
        full_name,
        phone,
        gender,
        college_id,
        enrollment_no,
      ]
    );
const token = jwt.sign(
  {
    phone,
    userId: result.rows[0].id,
  },
  process.env.JWT_SECRET || "CollegeRideSecretKey2026",
  {
    expiresIn: "7d",
  }
);
    res.status(201).json({
  success: true,
  message: "Profile completed successfully",
  token,
  user: result.rows[0],
});
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }



};

const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT
u.id,
u.full_name,
u.phone,
u.gender,
u.college_id,
c.college_name,
u.enrollment_no,
u.is_student_verified,
u.account_status
FROM users u
LEFT JOIN colleges c
ON c.id = u.college_id
WHERE u.id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
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
  sendOtp,
  verifyOtp,
  completeProfile,
  getProfile,
};