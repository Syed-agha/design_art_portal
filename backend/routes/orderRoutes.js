const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/authMiddleware");

/* Admin-only routes */
router.post("/", auth, orderController.createOrder);
router.put("/:id/status", auth, orderController.updateStatus);
router.put("/:id/caution", auth, orderController.updateCaution);
router.delete("/:id", auth, orderController.deleteOrder);
router.get("/search", auth, orderController.searchOrders);

// Admin-only: get all orders
router.get("/", auth, orderController.getAllOrders);

/* Public route */
router.get("/track/po", orderController.trackByPO);
router.get("/track/product", orderController.trackByProductCode);

module.exports = router;
