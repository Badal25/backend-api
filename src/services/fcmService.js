const admin = require("../config/firebase");

const sendPushNotification = async (
  fcmToken,
  title,
  body
) => {
  try {
    if (!fcmToken) {
      return false;
    }

    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body,
      },
    });

    return true;
  } catch (error) {
    console.error(
      "FCM Error:",
      error.message
    );

    return false;
  }
};

module.exports = {
  sendPushNotification,
};