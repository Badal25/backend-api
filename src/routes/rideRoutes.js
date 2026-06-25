const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  requestRide,
  acceptRideRequest,
  rejectRideRequest,
  getIncomingRequests,
  verifyStartOtp,
  verifyEndOtp,
  riderArrived,
  getMyRides,
  getRideDetails,
  getRideProgress,
  cancelRide
} = require("../controllers/rideController");

const router = express.Router();

router.post(
  "/request",
  authMiddleware,
  requestRide
);

router.get(
  "/incoming-requests",
  authMiddleware,
  getIncomingRequests
);

router.post(
  "/accept",
  authMiddleware,
  acceptRideRequest
);

router.post(
  "/reject",
  authMiddleware,
  rejectRideRequest
);

router.post(
  "/verify-start-otp",
  authMiddleware,
  verifyStartOtp
);

router.post(
  "/verify-end-otp",
  authMiddleware,
  verifyEndOtp
);
router.post(
  "/arrived",
  authMiddleware,
  riderArrived
);
router.get(
  "/my-rides",
  authMiddleware,
  getMyRides
);


router.get(
  "/:rideId",
  authMiddleware,
  getRideDetails
);

router.get(
  "/progress/:rideId",
  authMiddleware,
  getRideProgress
);

router.post(
  "/cancel",
  authMiddleware,
  cancelRide
);
module.exports = router;