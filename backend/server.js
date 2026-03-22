require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const { seedAdmin } = require("./seedadmin");


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

/* ========== Auth Routes ========== */
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

/* ========== Static Frontend ========== */
app.use(express.static(path.join(__dirname, "../frontend")));

/* ========== Root Redirect ========== */
app.get("/", (req, res) => {
  res.redirect("/admin/login.html");
});


/* ========== Server Start ========== */
const PORT = process.env.PORT || 5000;

seedAdmin()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  });
