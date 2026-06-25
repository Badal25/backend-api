const express = require("express");

const authenticate =
require("../middleware/authMiddleware");

const {
  triggerSOS,
  getSOSHistory,
  addEmergencyContact,
  getEmergencyContacts,
  deleteEmergencyContact
} = require("../controllers/sosController");

const router = express.Router();

router.post(
  "/trigger",
  authenticate,
  triggerSOS
);

router.get(
  "/history",
  authenticate,
  getSOSHistory
);

router.post(
  "/contacts",
  authenticate,
  addEmergencyContact
);

router.get(
  "/contacts",
  authenticate,
  getEmergencyContacts
);

router.delete(
  "/contacts/:contactId",
  authenticate,
  deleteEmergencyContact
);

module.exports = router;