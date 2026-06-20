import axiosInstance from './axiosInstance'

export const dashboardApi = {
  getStats: () => axiosInstance.get('/dashboard/stats'),
  getInventoryStatus: () => axiosInstance.get('/dashboard/inventory-status'),
  getRecentProducts: () => axiosInstance.get('/dashboard/recent-products'),
  getLowStockProducts: () => axiosInstance.get('/dashboard/low-stock-products'),
}
