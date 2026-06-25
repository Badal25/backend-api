const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(
  path.join(
    __dirname,
    "../../collegeride-b7570-firebase-adminsdk-fbsvc-7c2d3de6b6.json"
  )
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;