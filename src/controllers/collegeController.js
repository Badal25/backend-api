const pool = require("../config/db");

const getColleges = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, college_name FROM colleges WHERE is_active = true ORDER BY college_name"
    );

    res.json({
      success: true,
      colleges: result.rows,
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
  getColleges,
};