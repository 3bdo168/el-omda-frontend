const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:6543';

export const getAuthToken = () => {
  return localStorage.getItem('el_omda_token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('el_omda_token', token);
  } else {
    localStorage.removeItem('el_omda_token');
  }
};

export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('el_omda_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem('el_omda_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('el_omda_user');
  }
};

/**
 * Universal fetch wrapper with auth header and error handling
 */
export const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  // Add auth header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add content-type json if body is not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `خطأ في الخادم (${response.status})`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};

// API Endpoints
export const api = {
  // Auth
  login: (credential, password) => {
    let body = {};
    if (typeof credential === 'object' && credential !== null) {
      body = credential;
    } else {
      const input = String(credential || '').trim();
      if (input.includes('@')) {
        body = { email: input, password };
      } else {
        body = { phone: input, password };
      }
    }
    return request('/api/auth/login', { method: 'POST', body });
  },
  register: (userData) => request('/api/auth/register', { method: 'POST', body: userData }),
  getMe: () => request('/api/auth/me'),
  switchRole: (targetRole) => request('/api/auth/switch-role', { method: 'POST', body: { targetRole } }),

  // Store & Products
  getProducts: (params = '') => request(`/api/products?${params}`),
  getProductById: (id) => request(`/api/products/${id}`),
  getCategories: () => request('/api/products/categories'),

  // Orders
  createOrder: (orderData) => request('/api/orders', { method: 'POST', body: orderData }),
  getMyOrders: (page = 1) => request(`/api/orders/my-orders?page=${page}`),
  getOrderById: (id) => request(`/api/orders/${id}`),
  uploadReceipt: (orderId, formData) => request(`/api/orders/${orderId}/upload-receipt`, { method: 'POST', body: formData }),

  // Notifications
  getNotifications: (unreadOnly = false) => request(`/api/notifications?unread=${unreadOnly}`),
  markNotificationRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/api/notifications/read-all', { method: 'PATCH' }),

  // Admin APIs
  admin: {
    getOrders: (params = '') => request(`/api/admin/orders?${params}`),
    getOrderById: (id) => request(`/api/admin/orders/${id}`),
    updateOrderStatus: (id, status) => request(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: { status } }),
    updatePaymentStatus: (id, paymentStatus) => request(`/api/admin/orders/${id}/payment-status`, { method: 'PATCH', body: { paymentStatus } }),
    getPendingReceipts: () => request('/api/admin/receipts/pending'),
    verifyReceipt: (id, action, reason) => request(`/api/admin/orders/${id}/verify-receipt`, { method: 'PATCH', body: { action, reason } }),
    getPendingTraders: () => request('/api/admin/pending-traders'),
    approveTrader: (userId) => request(`/api/admin/approve-trader/${userId}`, { method: 'PATCH' }),
    rejectTrader: (userId, reason) => request(`/api/admin/reject-trader/${userId}`, { method: 'PATCH', body: { reason } }),
    createProduct: (productData) => request('/api/admin/products', { method: 'POST', body: productData }),
    updateProduct: (id, productData) => request(`/api/admin/products/${id}`, { method: 'PUT', body: productData }),
    deleteProduct: (id) => request(`/api/admin/products/${id}`, { method: 'DELETE' }),
    getCategories: () => request('/api/admin/categories'),
    createCategory: (data) => request('/api/admin/categories', { method: 'POST', body: typeof data === 'string' ? { name: data } : data }),
    updateCategory: (id, data) => request(`/api/admin/categories/${id}`, { method: 'PUT', body: data }),
    deleteCategory: (id) => request(`/api/admin/categories/${id}`, { method: 'DELETE' }),
    reorderCategories: (items) => request('/api/admin/categories/reorder', { method: 'PATCH', body: { items } }),
    getLowStock: () => request('/api/admin/inventory/low-stock'),
    getOutOfStock: () => request('/api/admin/inventory/out-of-stock'),
    uploadProductImage: (id, formData) => request(`/api/admin/products/${id}/upload-image`, { method: 'POST', body: formData }),
  },

  // Payment Destinations (Public & Owner Management)
  paymentDestinations: {
    getPublic: () => request('/api/payment-destinations/public'),
    getAll: () => request('/api/payment-destinations'),
    create: (data) => request('/api/payment-destinations', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/payment-destinations/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/api/payment-destinations/${id}`, { method: 'DELETE' }),
  },

  // Owner Reports & Employee Management
  owner: {
    getFinancialReport: (params = '') => request(`/api/owner/reports/financial?${params}`),
    getEmployeePerformance: (params = '') => request(`/api/owner/reports/employees?${params}`),
    getProductPerformance: (params = '') => request(`/api/owner/reports/products?${params}`),
    createEmployee: (data) => request('/api/owner/employees', { method: 'POST', body: data }),
    getAllEmployees: () => request('/api/owner/employees'),
    updateEmployee: (id, data) => request(`/api/owner/employees/${id}`, { method: 'PUT', body: data }),
    createAdjustment: (id, data) => request(`/api/owner/employees/${id}/adjustments`, { method: 'POST', body: data }),
    getEmployeeAdjustments: (id) => request(`/api/owner/employees/${id}/adjustments`),
  },
};

export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};
