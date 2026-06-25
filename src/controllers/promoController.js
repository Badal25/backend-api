const pool = require("../config/db");

// Get Active Promo Codes
const getActivePromoCodes = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT *
      FROM promo_codes
      WHERE is_active = true
      AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      promos: result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Validate Promo Code
const validatePromoCode = async (req, res) => {
  try {

    const { code, rideAmount } = req.body;

    const result = await pool.query(
      `
      SELECT *
      FROM promo_codes
      WHERE code = $1
      `,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found"
      });
    }

    const promo = result.rows[0];

    if (!promo.is_active) {
      return res.status(400).json({
        success: false,
        message: "Promo inactive"
      });
    }

    if (
      new Date(promo.expires_at) <
      new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Promo expired"
      });
    }

    if (
      rideAmount <
      Number(promo.min_ride_amount)
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum ride amount not met"
      });
    }

    let discount = 0;

    if (
      promo.discount_type ===
      "flat"
    ) {

      discount =
      Number(
        promo.discount_value
      );

    } else {

      discount =
      (rideAmount *
      Number(
        promo.discount_value
      )) / 100;

      if (
        promo.max_discount &&
        discount >
        promo.max_discount
      ) {
        discount =
        Number(
          promo.max_discount
        );
      }

    }

    res.json({
      success: true,
      discount
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  getActivePromoCodes,
  validatePromoCode
};