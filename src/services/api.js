/**
 * API Helper - Centralized API calls to backend
 */

import { getCurrentUserIdToken } from './firebaseAuth';

// Backend URL. Vercel does not always have VITE_API_URL configured, so keep a
// production fallback instead of accidentally sending API calls to the SPA
// rewrite and silently falling back to bundled demo settings.
const API_BASE = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://chungsuclq-backend.onrender.com/api'
);

/**
 * Helper to make API requests
 */
async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const adminPassword = localStorage.getItem('cslq_admin_password') || '';
  let idToken = null;
  try {
    idToken = await getCurrentUserIdToken();
  } catch (error) {
    // Public requests can continue without a token. Protected requests will
    // receive the server's 401 response and show the normal auth error.
    console.warn('[API] Could not load Firebase ID token:', error);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add admin auth header if available
  if (adminPassword) {
    headers['x-admin-password'] = adminPassword;
  }
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

// ==========================================
// Orders API
// ==========================================

export async function createOrder({ chungSucCode, packageId }) {
  const idToken = await getCurrentUserIdToken();
  if (!idToken) {
    throw new Error('Vui lòng đăng nhập Google trước khi đặt đơn.');
  }
  return apiRequest('/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ chungSucCode, packageId }),
  });
}

export async function getOrderStatus(orderId) {
  return apiRequest(`/orders/${orderId}`);
}

export async function listOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/orders${query ? `?${query}` : ''}`);
}

export async function getOrderLogs(orderId) {
  return apiRequest(`/orders/${orderId}/logs`);
}

// ==========================================
// Accounts API (Admin)
// ==========================================

export async function getAccountStats() {
  return apiRequest('/accounts/stats');
}

export async function importAccounts(text) {
  return apiRequest('/accounts/import', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function deleteAccount(accountId) {
  return apiRequest(`/accounts/${accountId}`, {
    method: 'DELETE',
  });
}

export async function purgeDeadAccounts() {
  return apiRequest('/accounts/dead/purge', {
    method: 'DELETE',
  });
}

// ==========================================
// Settings API (Admin)
// ==========================================

export async function getSettings() {
  return apiRequest('/settings');
}

// Public storefront endpoint. Unlike getSettings(), this response contains
// only package definitions and never exposes admin payment configuration.
export async function getPublicPackages() {
  return apiRequest('/packages');
}

// Public storefront branding/support settings. Payment details are never
// requested by this endpoint.
export async function getPublicSiteInfo() {
  return apiRequest('/site-info');
}

export async function updateSettings(packages) {
  return apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(packages),
  });
}

export async function updateSiteInfo(siteInfo) {
  return apiRequest('/settings/site-info', {
    method: 'PUT',
    body: JSON.stringify(siteInfo),
  });
}

export async function updatePaymentInfo(paymentInfo) {
  return apiRequest('/settings/payment-info', {
    method: 'PUT',
    body: JSON.stringify(paymentInfo),
  });
}

export async function resetSettings() {
  return apiRequest('/settings/reset', {
    method: 'POST',
  });
}

export async function testToolLive(code) {
  return apiRequest('/settings/test-tool', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// ==========================================
// Admin API
// ==========================================

export async function getAdminStats() {
  return apiRequest('/admin/stats');
}

export async function listAdminUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/admin/users${query ? `?${query}` : ''}`);
}

export async function updateAdminUser(uid, changes) {
  return apiRequest(`/admin/users/${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export async function triggerProcessOrders() {
  return apiRequest('/admin/process', {
    method: 'POST',
  });
}

export async function healthCheck() {
  return apiRequest('/health');
}

