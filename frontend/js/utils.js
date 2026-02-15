/**
 * utils.js
 * Common helper functions used across frontend
 * Backend-ready and framework-free
 */

/* =========================
   DOM HELPERS
========================= */

// Get element by ID safely
function getById(id) {
  return document.getElementById(id);
}

// Show element
function show(el) {
  el.classList.remove("hidden");
}

// Hide element
function hide(el) {
  el.classList.add("hidden");
}

// Set text content
function setText(el, text) {
  el.textContent = text;
}

/* =========================
   FORM & INPUT HELPERS
========================= */

// Get trimmed input value
function getInputValue(id) {
  return getById(id).value.trim();
}

// Clear input field
function clearInput(id) {
  getById(id).value = "";
}

/* =========================
   ERROR / MESSAGE HANDLING
========================= */

function showErrorMessage(elementId, message) {
  const el = getById(elementId);
  setText(el, message);
  show(el);
}

function hideErrorMessage(elementId) {
  hide(getById(elementId));
}

/* =========================
   DATE & TIME
========================= */

// Get current date time (consistent format)
function getCurrentDateTime() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

/* =========================
   SECURITY (FRONTEND LEVEL)
========================= */

// Simple frontend sanitization (backend will re-check)
function sanitizeInput(value) {
  return value.replace(/[<>]/g, "");
}

/* =========================
   API PLACEHOLDER
========================= */

// Wrapper for future fetch calls
async function apiRequest(url, method = "GET", body = null, token = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, options);
  return response.json();
}
