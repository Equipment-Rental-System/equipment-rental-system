const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const rentalRoutes = require("./routes/rentalRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => {
  res.json({
    message: "스마트 학과 기자재 대여 관리기 API가 실행 중입니다.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
