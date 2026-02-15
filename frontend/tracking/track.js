// ===== Track.js =====

// Reset UI & show error
function showError(message) {
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

function resetUI() {
  [
    "statusSection",
    "dispatchDetails",
    "errorMsg",
    "cautionBox"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
}

// Loading spinner
function showLoading(show = true) {
  const loader = document.getElementById("loading");
  if (show) loader.classList.remove("hidden");
  else loader.classList.add("hidden");
}

// ===== Handle successful tracking result =====
function showTrackingResult(order) {
  if (!order) return showError("Order not found");

  // 🚨 If caution exists → stop normal tracking
  if (order.caution_reason) {
    showCaution(order.caution_reason);
    return;
  }

  showStatus(order);
}

// ===== Show Caution =====
function showCaution(reason) {
  // Hide normal status if caution exists
  document.getElementById("statusSection").classList.remove("hidden");
  const box = document.getElementById("cautionBox");
  box.classList.remove("hidden");

  box.innerHTML = `
    <h3>⚠️ Production Delay Notice</h3>
    <p>The order is currently facing the following issue:</p>
    <strong>${reason}</strong>
  `;

  // Hide progress steps and dispatch details when caution exists
  const steps = document.querySelectorAll(".progress .step");
  steps.forEach(step => step.classList.remove("active"));
  document.getElementById("dispatchDetails").classList.add("hidden");
}

// ===== Track by PO =====
async function trackByPO() {
  resetUI();

  const poInput = document.getElementById("poInput");
  const productInput = document.getElementById("productInput");

  const po = poInput.value.trim();
  if (!po) return showError("Please enter PO number");

  productInput.value = "";

  showLoading(true);
  try {
    const res = await fetch(
      `http://localhost:5000/api/orders/track/po?po=${po}`
    );
    if (!res.ok) throw new Error("Order not found");

    const order = await res.json();
    showTrackingResult(order);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

// ===== Track by Product Code =====
async function trackByProduct() {
  resetUI();

  const poInput = document.getElementById("poInput");
  const productInput = document.getElementById("productInput");

  const code = productInput.value.trim();
  if (!code) return showError("Please enter product code");

  poInput.value = "";

  showLoading(true);
  try {
    const res = await fetch(
      `http://localhost:5000/api/orders/track/product?code=${code}`
    );
    if (!res.ok) throw new Error("Order not found");

    const order = await res.json();
    showTrackingResult(order);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

// ===== Status Functions =====
function showStatus(order) {
  document.getElementById("statusSection").classList.remove("hidden");

  const steps = [
    "step-printing",
    "step-pasting",
    "step-lamination",
    "step-cutting",
    "step-packing",
    "step-dispatch"
  ];

  steps.forEach(stepId =>
    document.getElementById(stepId)?.classList.remove("active")
  );

  for (let stepId of steps) {
    const el = document.getElementById(stepId);
    if (el) el.classList.add("active");
    if (stepId === "step-" + order.current_status) break;
  }

  if (order.current_status === "dispatch") {
    showDispatchDetails(order);
  }
}

function showDispatchDetails(order) {
  if (!order.dispatch_mode) return;

  const box = document.getElementById("dispatchDetails");
  box.classList.remove("hidden");

  let badgeClass = order.dispatch_mode.toLowerCase();

  let html = `
    <h3>Dispatch Details</h3>
    <p><strong>Mode:</strong>
      <span class="badge ${badgeClass}">
        ${order.dispatch_mode.toUpperCase()}
      </span>
    </p>
    <p><strong>Date:</strong> ${order.dispatch_datetime}</p>
  `;

  if (order.dispatch_mode === "tcs") {
    html += `
      <p><strong>Tracking #:</strong>
        <a href="https://www.tcsexpress.com/track/${order.tracking_number}"
           target="_blank">
          ${order.tracking_number}
        </a>
      </p>`;
  }

  if (order.dispatch_mode === "blty") {
    html += `<p><strong>BLTY Slip #:</strong> ${order.blty_slip_no}</p>`;
  }

  box.innerHTML = html;
}