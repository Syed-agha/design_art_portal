// Helper function for API requests
async function apiRequest(url, method = "GET", data = null, token = null) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (data) options.body = JSON.stringify(data);
  if (token) options.headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, options);
  return await res.json();
}

// =================== ADMIN LOGIN ===================
async function adminLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.classList.add("hidden");

  if (!email || !password) return showError("Please enter both email and password.");

  try {
    const res = await apiRequest("/api/auth/login", "POST", { email, password });

    if (res.token) {
      localStorage.setItem("adminToken", res.token);
      alert("Login successful! Redirecting to dashboard...");
      window.location.href = "dashboard.html";
    } else {
      showError(res.message || "Login failed");
    }
  } catch (err) {
    showError("Server error. Try again later.");
  }
}

// =================== LOAD ORDERS ===================
async function loadOrders() {
  const list = document.getElementById("ordersList");
  if (!list) return;
  list.innerHTML = "";
  const token = localStorage.getItem("adminToken");
  if (!token) {
    alert("Login required");
    window.location.href = "login.html";
    return;
  }

  try {
    // Fetch all orders (you can add a GET endpoint /api/orders for this)
    const orders = await apiRequest("/api/orders", "GET", null, token);

    orders.forEach(order => {
      const card = document.createElement("div");
      card.className = "order-card";

      card.innerHTML = `
        <div class="order-info">
          <div class="order-detail"><strong>PO:</strong> ${order.purchase_order_no || "-"}</div>
          <div class="order-detail"><strong>Product:</strong> ${order.product_code|| "-"}</div>
          <div class="order-detail"><strong>Caution:</strong> ${order.caution_reason || "None"}</div>
          <div class="order-detail"><strong>Status:</strong> <span class="status-badge status-${order.current_status}">${order.current_status.charAt(0).toUpperCase() + order.current_status.slice(1)}</span></div>
          ${order.dispatch_mode ? `
            <div class="order-detail"><strong>Dispatch Mode:</strong> ${order.dispatch_mode.toUpperCase()}</div>
            <div class="order-detail"><strong>Date:</strong> ${order.dispatch_datetime ? order.dispatch_datetime.toString().split('T')[0] : ''}</div>
            <div class="order-detail"><strong>Tracking/Slip:</strong> ${order.tracking_number || order.blty_slip_no || 'N/A'}</div>
          ` : '<div class="order-detail"><strong>Dispatch:</strong> Not yet</div>'}
        </div>
        <div class="update-section">
          <select id="status-${order.id}">
            <option value="printing" ${order.current_status === 'printing' ? 'selected' : ''}>Printing</option>
            <option value="pasting" ${order.current_status === 'pasting' ? 'selected' : ''}>Pasting</option>
            <option value="lamination" ${order.current_status === 'lamination' ? 'selected' : ''}>Lamination</option>
            <option value="cutting" ${order.current_status === 'cutting' ? 'selected' : ''}>Cutting</option>
            <option value="packing" ${order.current_status === 'packing' ? 'selected' : ''}>Packing</option>
            <option value="dispatch" ${order.current_status === 'dispatch' ? 'selected' : ''}>Dispatch</option>
          </select>
            <button class="update-status-btn" data-order-id="${order.id}">Update</button>
<select class="caution-select" data-id="${order.id}">
  <option value="">-- No Caution --</option>
  <option value="Art work pending">Art work pending</option>
  <option value="Sample approval pending">Sample approval pending</option>
  <option value="Machine Repairing">Machine Repairing</option>
  <option value="No Material">No Material</option>
  <option value="Electricity shutdown">Electricity shutdown</option>
</select>

<button class="update-caution-btn" data-id="${order.id}">
  Update Caution
</button>

          <button class="delete-btn" data-order-id="${order.id}">Delete</button>
        </div>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    alert("Failed to fetch orders");
  }
}

async function updateCaution(orderId) {
  const select = document.querySelector(
    `.caution-select[data-id="${orderId}"]`
  );

  const caution_reason = select.value || null;

  try {
    const res = await fetch(
      `/api/orders/${orderId}/caution`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        },
        body: JSON.stringify({ caution_reason })
      }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    alert("Caution updated successfully");
    loadOrders(); // refresh table
  } catch (err) {
    alert(err.message);
  }
}
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("update-caution-btn")) {
    const orderId = e.target.dataset.id;
    updateCaution(orderId);
  }
  if (e.target.classList.contains("update-status-btn")) {
    updateOrder(e.target.dataset.orderId);
  }
  if (e.target.classList.contains("delete-btn")) {
    deleteOrder(e.target.dataset.orderId);
  }
});

// =================== UPDATE ORDER ===================
async function updateOrder(orderId) {
  const newStatus = document.getElementById(`status-${orderId}`).value;

  let dispatch = null;

  // 🚚 Dispatch logic
  if (newStatus === "dispatch") {
    const mode = prompt("Enter dispatch mode (van / tcs / blty):");
    if (!mode) return alert("Dispatch mode is required");

    const dispatchDate = prompt(
      "Enter dispatch date (YYYY-MM-DD)\nExample: 2026-01-14"
    );
    if (!dispatchDate) return alert("Dispatch date is required");

    dispatch = {
      mode: mode.toLowerCase(),
      dispatch_datetime: dispatchDate
    };

    if (mode.toLowerCase() === "tcs") {
      const tracking = prompt("Enter TCS Tracking Number:");
      if (!tracking) return alert("Tracking number required");
      dispatch.tracking_number = tracking;
    }

    if (mode.toLowerCase() === "blty") {
      const blty = prompt("Enter BLTY Slip Number:");
      if (!blty) return alert("BLTY slip number required");
      dispatch.blty_slip_no = blty;
    }
  }

  const token = localStorage.getItem("adminToken");

  try {
    // 🔁 1) Update status + dispatch
    const res = await apiRequest(
      `/api/orders/${orderId}/status`,
      "PUT",
      { status: newStatus, dispatch },
      token
    );

    alert(res.message);
    loadOrders(); // refresh dashboard
  } catch (err) {
    console.error(err);
    alert("Failed to update order");
  }
}

// =================== DELETE ORDER ===================
async function deleteOrder(orderId) {
  if (!confirm("Are you sure you want to permanently delete this order?")) {
    return;
  }

  const token = localStorage.getItem("adminToken");

  try {
    const res = await apiRequest(
      `/api/orders/${orderId}`,
      "DELETE",
      null,
      token
    );

    alert(res.message);
    loadOrders();
  } catch (err) {
    alert("Failed to delete order");
  }
}

// =================== SEARCH ORDERS ===================
async function searchOrders() {
  const po = document.getElementById("searchPO").value.trim();
  const code = document.getElementById("searchCode").value.trim();
  const token = localStorage.getItem("adminToken");

  if (!po && !code) return alert("Enter PO number or Product Code to search");

  try {
    const url = new URL("/api/orders/search", window.location.origin);
    if (po) url.searchParams.append("po", po);
    if (code) url.searchParams.append("code", code);

    const orders = await apiRequest(url.toString(), "GET", null, token);

    const list = document.getElementById("ordersList");
    list.innerHTML = "";

    orders.forEach(order => {
      const card = document.createElement("div");
      card.className = "order-card";
      card.innerHTML = `
        <div class="order-info">
          <div class="order-detail"><strong>PO:</strong> ${order.purchase_order_no || "-"}</div>
          <div class="order-detail"><strong>Product:</strong> ${order.product_code|| "-"}</div>
          <div class="order-detail"><strong>Caution:</strong> ${order.caution_reason || "None"}</div>
          <div class="order-detail"><strong>Status:</strong> <span class="status-badge status-${order.current_status}">${order.current_status.charAt(0).toUpperCase() + order.current_status.slice(1)}</span></div>
          ${order.dispatch_mode ? `
            <div class="order-detail"><strong>Dispatch Mode:</strong> ${order.dispatch_mode.toUpperCase()}</div>
            <div class="order-detail"><strong>Date:</strong> ${order.dispatch_datetime}</div>
            <div class="order-detail"><strong>Tracking/Slip:</strong> ${order.tracking_number || order.blty_slip_no || 'N/A'}</div>
          ` : '<div class="order-detail"><strong>Dispatch:</strong> Not yet</div>'}
        </div>
        <div class="update-section">
          <select id="status-${order.id}">
            <option value="printing" ${order.current_status === 'printing' ? 'selected' : ''}>Printing</option>
            <option value="pasting" ${order.current_status === 'pasting' ? 'selected' : ''}>Pasting</option>
            <option value="lamination" ${order.current_status === 'lamination' ? 'selected' : ''}>Lamination</option>
            <option value="cutting" ${order.current_status === 'cutting' ? 'selected' : ''}>Cutting</option>
            <option value="packing" ${order.current_status === 'packing' ? 'selected' : ''}>Packing</option>
            <option value="dispatch" ${order.current_status === 'dispatch' ? 'selected' : ''}>Dispatch</option>
          </select>
          <button class="update-status-btn" data-order-id="${order.id}">Update</button>
          <select class="caution-select" data-id="${order.id}">
  <option value="">-- No Caution --</option>
  <option value="Art work pending">Art work pending</option>
  <option value="Sample approval pending">Sample approval pending</option>
  <option value="Machine Repairing">Machine Repairing</option>
  <option value="No Material">No Material</option>
  <option value="Electricity shutdown">Electricity shutdown</option>
</select>

<button class="update-caution-btn" data-id="${order.id}">
  Update Caution
</button>
          <button class="delete-btn" data-order-id="${order.id}">Delete</button>
        </div>
      `;
      list.appendChild(card);
    });

  } catch (err) {
    alert(err.message || "Search failed");
  }
}

// =================== CREATE ORDER ===================
async function createOrder() {
  const po = document.getElementById("newPO").value.trim();
  const productCode = document.getElementById("newProductCode").value.trim();

  if (!po && !productCode) return alert("Please enter atleast a PO number or Product Code.");

  const token = localStorage.getItem("adminToken");

  try {
    const res = await apiRequest("/api/orders", "POST", { purchase_order_no: po, product_code: productCode }, token);
    alert(res.message);
    document.getElementById("newPO").value = "";
    document.getElementById("newProductCode").value = "";
    loadOrders();
  } catch (err) {
    alert("Failed to create order");
  }
}

// =================== SHOW ERROR ===================
function showError(message) {
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

// Initial load & event listeners
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.addEventListener("click", adminLogin);

  const createOrderBtn = document.getElementById("createOrderBtn");
  if (createOrderBtn) createOrderBtn.addEventListener("click", createOrder);

  const searchOrdersBtn = document.getElementById("searchOrdersBtn");
  if (searchOrdersBtn) searchOrdersBtn.addEventListener("click", searchOrders);

  const resetOrdersBtn = document.getElementById("resetOrdersBtn");
  if (resetOrdersBtn) resetOrdersBtn.addEventListener("click", loadOrders);
});

window.addEventListener("load", () => {
  if (document.getElementById("ordersList")) loadOrders();
});
