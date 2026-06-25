const express = require("express");

const router = express.Router();

const authenticate =
require("../middleware/authMiddleware");
require("../middleware/accountStatus");

const {
  getDashboardStats,
  getPendingRiders,
  approveRider,
  rejectRider,
  getAllComplaints,
  resolveComplaint,
  closeComplaint,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getAllUsers,
  suspendUser,
  banUser,
  activateUser,
  getAllRides,
  getActiveRides,
getRideById,
adminCancelRide,
getActiveSOS,
getAnalytics,
getMonthlyAnalytics
} = require(
  "../controllers/adminController"
);

router.get(
  "/dashboard",
  getDashboardStats
);

router.get(
  "/pending-riders",
  getPendingRiders
);

router.put(
  "/approve-rider/:verificationId",
  approveRider
);

router.put(
  "/reject-rider/:verificationId",
  rejectRider
);

router.get(
  "/complaints",
  getAllComplaints
);

router.put(
  "/complaints/:complaintId/resolve",
  resolveComplaint
);

router.put(
  "/complaints/:complaintId/close",
  closeComplaint
);

router.get(
  "/withdrawals",
  getPendingWithdrawals
);

router.put(
  "/withdrawals/:withdrawalId/approve",
  approveWithdrawal
);

router.put(
  "/withdrawals/:withdrawalId/reject",
  rejectWithdrawal
);

router.get(
  "/users",
  authenticate,
  getAllUsers
);

router.put(
  "/users/:userId/suspend",
  authenticate,
  suspendUser
);

router.put(
  "/users/:userId/ban",
  authenticate,
  banUser
);

router.put(
  "/users/:userId/activate",
  authenticate,
  activateUser
);

router.get(
  "/rides",
  authenticate,
  getAllRides
);

router.get(
  "/rides",
  getActiveRides
);

router.get(
  "/rides/:rideId",
  getRideById
);

router.put(
  "/rides/:rideId/cancel",
  adminCancelRide
);

router.get(
  "/sos",
  getActiveSOS
);

router.get(
  "/analytics",
  getAnalytics
);

router.get(
  "/analytics/monthly",
  getMonthlyAnalytics
);
module.exports = router;