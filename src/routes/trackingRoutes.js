const express = require("express");

const router = express.Router();

const {
  createTrackingLink,
  getTrackingDetails
} = require(
  "../controllers/trackingController"
);

router.post(
  "/create/:rideId",
  createTrackingLink
);

router.get(
  "/:token",
  getTrackingDetails
);

module.exports = router;