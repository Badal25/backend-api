const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  addVehicle,
  applyForRider,
  getRiderStatus,
  offerRide,
  searchNearbyRides,
  getMyVehicles
} = require("../controllers/riderController");

const router = express.Router();

// Vehicle
router.post(
  "/vehicle",
  authMiddleware,
  addVehicle
);

// Rider Apply
router.post(
  "/apply",
  authMiddleware,
  applyForRider
);

// Status
router.get(
  "/status",
  authMiddleware,
  getRiderStatus
);
// Offer Ride
router.post(
  "/offer-ride",
  authMiddleware,
  offerRide
);
// Search Rides
router.get(
  "/nearby-rides",
  authMiddleware,
  searchNearbyRides
);

router.get(
  "/my-vehicles",
  authMiddleware,
  getMyVehicles
);

module.exports = router;