require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");


const app = express();

/* ========== Security Middleware ========== */
app.use(helmet());
app.use(cors());
app.use(express.json());

/* ========== Rate Limiter ========== */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

/* ========== Test Route ========== */
app.get("/", (req, res) => {
  res.json({ message: "Design Arts API is running" });
});

/* ========== Auth Routes ========== */
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);


/* ========== Server Start ========== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
