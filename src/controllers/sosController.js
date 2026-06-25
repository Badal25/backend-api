const pool = require("../config/db");
const triggerSOS = async (req, res) => {
  try {

    const { userId } = req.user;

    const {
      ride_id,
      latitude,
      longitude,
      emergency_message
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO sos_logs
      (
        user_id,
        ride_id,
        latitude,
        longitude,
        emergency_message
      )
      VALUES
      ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [
        userId,
        ride_id,
        latitude,
        longitude,
        emergency_message
      ]
    );



    const contacts =
await pool.query(
  `
  SELECT *
  FROM emergency_contacts
  WHERE user_id = $1
  `,
  [userId]
);

for (
  const contact
  of contacts.rows
) {

  console.log(
    `
    SOS ALERT

    Send SMS to:
    ${contact.contact_phone}

    Contact:
    ${contact.contact_name}
    `
  );

}

await sendRideNotification(
  ride.rider_id,
  "SOS ALERT",
  "Emergency reported in current ride."
);

    res.status(201).json({
      success: true,
      message: "SOS Alert Sent Successfully",
      sos: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

const getSOSHistory = async (req, res) => {
  try {

    const { userId } = req.user;

    const result = await pool.query(
      `
      SELECT *
      FROM sos_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      total: result.rows.length,
      sos_logs: result.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Add Emergency Contact
const addEmergencyContact = async (req, res) => {
  try {

    const { userId } = req.user;

    const {
      contact_name,
      relationship,
      contact_phone
    } = req.body;

    await pool.query(
      `
      INSERT INTO emergency_contacts
      (
        user_id,
        contact_name,
        relationship,
        contact_phone
      )
      VALUES
      ($1,$2,$3,$4)
      `,
      [
        userId,
        contact_name,
        relationship,
        contact_phone
      ]
    );

    res.json({
      success: true,
      message:
      "Emergency contact added"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Get Emergency Contacts
const getEmergencyContacts =
async (req, res) => {
  try {

    const { userId } = req.user;

    const result =
    await pool.query(
      `
      SELECT *
      FROM emergency_contacts
      WHERE user_id = $1
      ORDER BY id DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      contacts:
      result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Delete Emergency Contact
const deleteEmergencyContact =
async (req, res) => {
  try {

    const { contactId } =
    req.params;

    await pool.query(
      `
      DELETE FROM
      emergency_contacts
      WHERE id = $1
      `,
      [contactId]
    );

    res.json({
      success: true,
      message:
      "Emergency contact deleted"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  triggerSOS,
  getSOSHistory,
  addEmergencyContact,
  getEmergencyContacts,
  deleteEmergencyContact
};