/**
 * API Helper - Centralized API calls to backend
 */

// Backend URL - change this based on environment
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Helper to make API requests
 */
async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const adminPassword = localStorage.getItem('cslq_admin_password') || '';

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add admin auth header if available
  if (adminPassword) {
    headers['x-admin-password'] = adminPassword;
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

export async function createOrder({ chungSucCode, packageId, customerName }) {
  return apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({ chungSucCode, packageId, customerName }),
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

export async function resetSettings() {
  return apiRequest('/settings/reset', {
    method: 'POST',
  });
}

export async function getCookieStatus() {
  return apiRequest('/settings/cookies');
}

export async function saveCookies(cookies) {
  return apiRequest('/settings/cookies', {
    method: 'POST',
    body: JSON.stringify({ cookies }),
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

export async function triggerProcessOrders() {
  return apiRequest('/admin/process', {
    method: 'POST',
  });
}

export async function healthCheck() {
  return apiRequest('/health');
}

