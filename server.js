
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const pool = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const collegeRoutes = require("./src/routes/collegeRoutes");
const riderRoutes = require("./src/routes/riderRoutes");
const locationRoutes = require("./src/routes/locationRoutes");
const sosRoutes = require("./src/routes/sosRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const activeRideRoutes = require("./src/routes/activeRideRoutes");
const rideRoutes = require("./src/routes/rideRoutes");
const ratingRoutes = require("./src/routes/ratingRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const rideSocket = require("./src/socket/rideSocket");
const userRoutes = require("./src/routes/userRoutes");
const complaintRoutes = require("./src/routes/complaintRoutes");
const rideHistoryRoutes = require("./src/routes/rideHistoryRoutes");
const walletRoutes = require("./src/routes/walletRoutes");
const withdrawalRoutes = require("./src/routes/withdrawalRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const trackingRoutes = require("./src/routes/trackingRoutes");
const referralRoutes = require("./src/routes/referralRoutes");
const promoRoutes = require("./src/routes/promoRoutes");
const matchingRoutes = require("./src/routes/matchingRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");


app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/location",locationRoutes);
app.use("/api/sos",sosRoutes);
app.use("/api/notifications",notificationRoutes);
app.use("/api/rides",activeRideRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/ratings",ratingRoutes);
app.use("/api/chat",chatRoutes);
app.use("/api/users",userRoutes);
app.use("/api/complaints",complaintRoutes);
app.use("/api/history",rideHistoryRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/tracking",trackingRoutes);
app.use("/api/referrals",referralRoutes);
app.use("/api/promo",promoRoutes);
app.use("/api/matching",matchingRoutes);
app.use("/api/dashboard",dashboardRoutes);

app.get("/", (req, res) => {
  res.send("CollegeRide Backend Running");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

rideSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
