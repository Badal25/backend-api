const pool = require("../config/db");

const checkAccountStatus =
async (req,res,next) => {

  try {

    const result =
    await pool.query(
      `
      SELECT account_status
      FROM users
      WHERE id = $1
      `,
      [req.user.userId]
    );

    if(result.rows.length === 0){
      return res.status(404).json({
        success:false,
        message:"User not found"
      });
    }

    const status =
    result.rows[0].account_status;

    if(status === "banned"){
      return res.status(403).json({
        success:false,
        message:"Account banned"
      });
    }

    if(status === "suspended"){
      return res.status(403).json({
        success:false,
        message:"Account suspended"
      });
    }

    next();

  } catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

module.exports =
checkAccountStatus;