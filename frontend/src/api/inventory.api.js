import axiosInstance from './axiosInstance'

export const inventoryApi = {
  getAllInventory: (params) => axiosInstance.get('/inventory', { params }),
  getInventoryByProductId: (productId) => axiosInstance.get(`/inventory/${productId}`),
  adjustInventory: (productId, data) => axiosInstance.patch(`/inventory/${productId}/adjust`, data),
  getLowStockItems: () => axiosInstance.get('/inventory/alerts/low-stock'),
  // Named stock operations
  increaseStock: (productId, qty) => axiosInstance.post(`/inventory/${productId}/increase`, { qty }),
  decreaseStock: (productId, qty) => axiosInstance.post(`/inventory/${productId}/decrease`, { qty }),
  reserveStock: (productId, qty) => axiosInstance.post(`/inventory/${productId}/reserve`, { qty }),
  releaseStock: (productId, qty) => axiosInstance.post(`/inventory/${productId}/release`, { qty }),
}
