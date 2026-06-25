const express = require("express");

const authMiddleware =
require("../middleware/authMiddleware");

const {
  createComplaint,
  getMyComplaints
} = require("../controllers/complaintController");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  createComplaint
);

router.get(
  "/my-complaints",
  authMiddleware,
  getMyComplaints
);

module.exports = router;