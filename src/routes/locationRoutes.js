const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  updateLocation,
  getUserLocation,
  trackRide,
  getRideDistance,
  trackRideByRideId,
updateRideTracking
} = require("../controllers/locationController");

const router = express.Router();

router.post(
  "/update",
  authMiddleware,
  updateLocation
);

router.get(
  "/:userId",
  authMiddleware,
  getUserLocation
);

router.get(
  "/track/:riderId/:passengerId",
  authMiddleware,
  trackRide
);

router.get(
  "/distance/:riderId/:passengerId",
  authMiddleware,
  getRideDistance
);

router.get(
  "/track-ride/:rideId",
  authMiddleware,
  trackRideByRideId
);

router.get(
  "/tracking/:rideId",
  authMiddleware,
  updateRideTracking
);
module.exports = router;