const pool = require("../config/db");
const createNotification =
require("../utils/notificationHelper");

module.exports = (io) => {

  io.on("connection", (socket) => {

    socket.on(
  "userOnline",
  async (userId) => {

    try {

      socket.userId = userId;

      await pool.query(
        `
        UPDATE users
        SET is_online = true
        WHERE id = $1
        `,
        [userId]
      );

      io.emit(
        "userStatusChanged",
        {
          userId,
          is_online: true
        }
      );

    } catch (error) {

      console.error(error);

    }

  }
);
  console.log(
      "User Connected:",
      socket.id
    );

    // Join Ride Room

    socket.on(
  "joinRideRoom",
  async ({ rideId, userId }) => {

    try {

      const result =
      await pool.query(
        `
        SELECT *
        FROM rides
        WHERE
          id = $1
          AND
          (
            rider_id = $2
            OR
            passenger_id = $2
          )
        `,
        [
          rideId,
          userId
        ]
      );

      if (
        result.rows.length === 0
      ) {

        socket.emit(
          "joinRideRoomError",
          {
            message:
            "Unauthorized ride access"
          }
        );

        return;
      }

      socket.join(
        `ride_${rideId}`
      );

      socket.emit(
        "joinRideRoomSuccess",
        {
          rideId
        }
      );

      console.log(
        `User ${userId}
         joined ride_${rideId}`
      );

    } catch (error) {

      console.error(error);

    }

  }
);

    // Leave Ride Room

    socket.on(
      "leaveRideRoom",
      (rideId) => {

        socket.leave(
          `ride_${rideId}`
        );

      }
    );
// Handle incoming chat messages for a ride and broadcast to room
socket.on(
  "sendMessage",
  async (data) => {

    try {

      const {
        rideId,
        senderId,
        message
      } = data;

      const rideResult =
      await pool.query(
        `
        SELECT
        rider_id,
        passenger_id
        FROM rides
        WHERE id = $1
        `,
        [rideId]
      );

      if (
        rideResult.rows.length === 0
      ) {
        return;
      }

      const ride =
      rideResult.rows[0];

      const receiverId =
        senderId === ride.rider_id
        ? ride.passenger_id
        : ride.rider_id;

const memberCheck =
await pool.query(
  `
  SELECT *
  FROM rides
  WHERE
    id = $1
    AND
    (
      rider_id = $2
      OR
      passenger_id = $2
    )
  `,
  [
    rideId,
    senderId
  ]
);

if (
  memberCheck.rows.length === 0
) {

  socket.emit(
    "messageError",
    {
      message:
      "Unauthorized sender"
    }
  );

  return;
}

      const result =
      await pool.query(
        `
        INSERT INTO ride_messages
        (
          ride_id,
          sender_id,
          message
        )
        VALUES
        ($1,$2,$3)
        RETURNING *
        `,
        [
          rideId,
          senderId,
          message
        ]
      );

      await createNotification(
        receiverId,
        "New Message",
        message
      );

      io.to(
        `ride_${rideId}`
      ).emit(
        "newMessage",
        result.rows[0]
      );

    } catch (error) {

      console.error(error);

    }

  }
);
// Handle user typing event
socket.on(
  "typing",
  ({ rideId, userId }) => {

    socket.to(
      `ride_${rideId}`
    ).emit(
      "userTyping",
      {
        userId
      }
    );

  }
);
// Handle user stopped typing event
socket.on(
  "stopTyping",
  ({ rideId, userId }) => {

    socket.to(
      `ride_${rideId}`
    ).emit(
      "userStoppedTyping",
      {
        userId
      }
    );

  }
);

// Handle message delivery status update
socket.on(
  "messageDelivered",
  async (messageId) => {

    try {

      await pool.query(
        `
        UPDATE ride_messages
        SET message_status = 'delivered'
        WHERE id = $1
        `,
        [messageId]
      );

      io.emit(
        "messageDeliveredUpdate",
        {
          messageId
        }
      );

    } catch (error) {

      console.error(error);

    }

  }
);

// Handle message read status update
socket.on(
  "messageRead",
  async (messageId) => {

    try {

      await pool.query(
        `
        UPDATE ride_messages
        SET message_status = 'read'
        WHERE id = $1
        `,
        [messageId]
      );

      io.emit(
        "messageReadUpdate",
        {
          messageId
        }
      );

    } catch (error) {

      console.error(error);

    }

  }
);

// Handle marking all messages in a ride as read by a user
socket.on(
  "markMessagesRead",
  async ({ rideId, userId }) => {

    try {

      await pool.query(
        `
        UPDATE ride_messages
        SET message_status = 'read'
        WHERE
          ride_id = $1
          AND sender_id <> $2
          AND message_status <> 'read'
        `,
        [
          rideId,
          userId
        ]
      );

      io.to(
        `ride_${rideId}`
      ).emit(
        "messagesMarkedRead",
        {
          rideId,
          userId
        }
      );

    } catch (error) {

      console.error(error);

    }

  }
);
// Handle marking all messages in a ride as delivered to a user  
socket.on(
  "markMessagesDelivered",
  async ({ rideId, userId }) => {

    try {

      await pool.query(
        `
        UPDATE ride_messages
        SET message_status = 'delivered'
        WHERE
          ride_id = $1
          AND sender_id <> $2
          AND message_status = 'sent'
        `,
        [
          rideId,
          userId
        ]
      );

      io.to(
        `ride_${rideId}`
      ).emit(
        "messagesDelivered",
        {
          rideId
        }
      );

    } catch (error) {

      console.error(error);

    }

  }
);
// Handle user disconnect

    socket.on(
  "disconnect",
  async () => {

    try {

      if (socket.userId) {

        await pool.query(
          `
          UPDATE users
          SET
            is_online = false,
            last_seen = CURRENT_TIMESTAMP
          WHERE id = $1
          `,
          [socket.userId]
        );

        io.emit(
          "userStatusChanged",
          {
            userId: socket.userId,
            is_online: false
          }
        );

      }

      console.log(
        "User Disconnected:",
        socket.id
      );

    } catch (error) {

      console.error(error);

    }

  }
);

  });

}; 
