import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("veeparts_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("veeparts_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
  getRecentOrders: () => api.get("/dashboard/recent-orders"),
  getTopSelling: () => api.get("/dashboard/top-selling"),
  getRevenueChart: (days: number) =>
    api.get(`/dashboard/revenue?days=${days}`),
};

// Products API
export const productsApi = {
  getAll: (params?: {
    page?: number;
    search?: string;
    category?: string;
    status?: string;
  }) => api.get("/products", { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: FormData) =>
    api.post("/products", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: FormData) =>
    api.put(`/products/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => api.delete(`/products/${id}`),
  bulkUpload: (data: Record<string, unknown>[]) =>
    api.post("/products/bulk", { products: data }),
};

// Orders API
export const ordersApi = {
  getAll: (params?: { status?: string; from?: string; to?: string }) =>
    api.get("/orders", { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
};

// Pricing API
export const pricingApi = {
  getComparisons: () => api.get("/pricing/comparisons"),
  getRecommendations: () => api.get("/pricing/recommendations"),
  getPriceHistory: (productId: string) =>
    api.get(`/pricing/history/${productId}`),
};

// Analytics API
export const analyticsApi = {
  getRevenue: (days: number) => api.get(`/analytics/revenue?days=${days}`),
  getBestsellers: () => api.get("/analytics/bestsellers"),
  getOrderStatus: () => api.get("/analytics/order-status"),
  getGovernorates: () => api.get("/analytics/governorates"),
  getReturnRate: () => api.get("/analytics/return-rate"),
  getAvgReview: () => api.get("/analytics/avg-review"),
};

// Store Profile API
export const profileApi = {
  get: () => api.get("/store/profile"),
  update: (data: FormData) =>
    api.put("/store/profile", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default api;
