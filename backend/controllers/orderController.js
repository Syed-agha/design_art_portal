const db = require("../config/db");

/* =========================
   CREATE ORDER (ADMIN)
========================= */
exports.createOrder = (req, res) => {
  const { purchase_order_no, product_code } = req.body;

  if (!purchase_order_no && !product_code) {
    return res.status(400).json({
      message: "Provide at least a PO number or a Product Code"
    });
  }

  const query = `
    INSERT INTO orders (purchase_order_no, product_code, created_by)
    VALUES (?, ?, ?)
  `;

  db.query(
    query,
    [purchase_order_no || null, product_code || null, req.admin.id],
    (err) => {
      if (err) return res.status(400).json({ message: "Order already exists" });
      res.json({ message: "Order created successfully" });
    }
  );
};

/* =========================
   UPDATE STATUS / DISPATCH (ADMIN)
========================= */
exports.updateStatus = (req, res) => {
  const orderId = req.params.id;
  const { status, dispatch } = req.body;

  const validStatuses = [
    "printing",
    "pasting",
    "lamination",
    "cutting",
    "packing",
    "dispatch"
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  // Block status update if caution exists
  db.query(
    "SELECT caution_reason FROM orders WHERE id = ?",
    [orderId],
    (err, rows) => {
      if (err || rows.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (rows[0].caution_reason) {
        return res.status(400).json({
          message: "Clear caution before updating status"
        });
      }

      // Update status
      db.query(
        "UPDATE orders SET current_status = ? WHERE id = ?",
        [status, orderId],
        (err) => {
          if (err) {
            return res.status(500).json({ message: "Status update failed" });
          }

          // Handle dispatch
          if (status === "dispatch") {
            const {
              mode,
              dispatch_datetime,
              tracking_number,
              blty_slip_no
            } = dispatch || {};

            if (!mode || !dispatch_datetime) {
              return res.status(400).json({
                message: "Dispatch mode and date are required"
              });
            }

            const upsertDispatch = `
              INSERT INTO dispatch_details
              (order_id, dispatch_mode, dispatch_datetime, tracking_number, blty_slip_no)
              VALUES (?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                dispatch_mode = VALUES(dispatch_mode),
                dispatch_datetime = VALUES(dispatch_datetime),
                tracking_number = VALUES(tracking_number),
                blty_slip_no = VALUES(blty_slip_no)
            `;

            return db.query(
              upsertDispatch,
              [
                orderId,
                mode,
                dispatch_datetime,
                tracking_number || null,
                blty_slip_no || null
              ],
              (err) => {
                if (err) {
                  return res.status(500).json({ message: "Dispatch failed" });
                }

                res.json({ message: "Order dispatched successfully" });
              }
            );
          }

          res.json({ message: "Status updated successfully" });
        }
      );
    }
  );
};

/* =========================
   UPDATE CAUTION (ADMIN)
========================= */
exports.updateCaution = (req, res) => {
  const orderId = req.params.id;
  const { caution_reason } = req.body;

  const validCautions = [
    "Art work pending",
    "Sample approval pending",
    "Machine Repairing",
    "No Material",
    "Electricity shutdown"
  ];

  // Allow clearing caution
  if (caution_reason && !validCautions.includes(caution_reason)) {
    return res.status(400).json({ message: "Invalid caution reason" });
  }

  const query = `
    UPDATE orders
    SET caution_reason = ?
    WHERE id = ?
  `;

  db.query(query, [caution_reason || null, orderId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to update caution" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Caution updated successfully" });
  });
};

/* =========================
   DELETE ORDER (ADMIN)
========================= */
exports.deleteOrder = (req, res) => {
  const orderId = req.params.id;

  db.query("DELETE FROM orders WHERE id = ?", [orderId], (err, result) => {
    if (err) return res.status(500).json({ message: "Failed to delete order" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  });
};

/* =========================
   TRACK ORDER (PUBLIC)
========================= */
exports.trackByPO = (req, res) => {
  const { po } = req.query;
  if (!po) return res.status(400).json({ message: "PO number required" });

  const query = `
    SELECT 
      o.purchase_order_no,
      o.product_code,
      o.current_status,
      o.caution_reason,
      d.dispatch_mode,
      DATE_FORMAT(d.dispatch_datetime, '%Y-%m-%d') AS dispatch_datetime,
      d.tracking_number,
      d.blty_slip_no
    FROM orders o
    LEFT JOIN dispatch_details d ON o.id = d.order_id
    WHERE o.purchase_order_no = ?
    ORDER BY d.id DESC
    LIMIT 1
  `;

  db.query(query, [po], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "Order not found" });
    res.json(results[0]);
  });
};

exports.trackByProductCode = (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: "Product code required" });

  const query = `
    SELECT 
      o.purchase_order_no,
      o.product_code,
      o.current_status,
      o.caution_reason,
      d.dispatch_mode,
      DATE_FORMAT(d.dispatch_datetime, '%Y-%m-%d') AS dispatch_datetime,
      d.tracking_number,
      d.blty_slip_no
    FROM orders o
    LEFT JOIN dispatch_details d ON o.id = d.order_id
    WHERE o.product_code = ?
    ORDER BY d.id DESC
    LIMIT 1
  `;

  db.query(query, [code], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "Order not found" });
    res.json(results[0]);
  });
};

/* =========================
   GET ALL ORDERS (ADMIN)
========================= */
exports.getAllOrders = (req, res) => {
  const query = `
    SELECT 
      o.id,
      o.purchase_order_no,
      o.product_code,
      o.current_status,
      o.caution_reason,
      d.dispatch_mode,
      DATE_FORMAT(d.dispatch_datetime, '%Y-%m-%d') AS dispatch_datetime,
      d.tracking_number,
      d.blty_slip_no
    FROM orders o
    LEFT JOIN dispatch_details d ON o.id = d.order_id
    ORDER BY o.id DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch orders" });
    res.json(results);
  });
};

/* =========================
   SEARCH ORDERS (ADMIN)
========================= */
exports.searchOrders = (req, res) => {
  const { po, code } = req.query;
  if (!po && !code) return res.status(400).json({ message: "PO or Product Code required" });

  let where = [];
  let values = [];

  if (po) {
    where.push("o.purchase_order_no LIKE ?");
    values.push(`%${po}%`);
  }
  if (code) {
    where.push("o.product_code LIKE ?");
    values.push(`%${code}%`);
  }

  const query = `
    SELECT 
      o.id,
      o.purchase_order_no,
      o.product_code,
      o.current_status,
      o.caution_reason,
      d.dispatch_mode,
      DATE_FORMAT(d.dispatch_datetime, '%Y-%m-%d') AS dispatch_datetime,
      d.tracking_number,
      d.blty_slip_no
    FROM orders o
    LEFT JOIN dispatch_details d ON o.id = d.order_id
    WHERE ${where.join(" AND ")}
    ORDER BY o.id DESC
  `;

  db.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ message: "Search failed" });
    res.json(results); // ALWAYS ARRAY
  });
};