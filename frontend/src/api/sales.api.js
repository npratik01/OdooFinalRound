import axiosInstance from './axiosInstance'

export const salesApi = {
  getSalesOrders: (params) => axiosInstance.get('/sales', { params }),
  getSalesOrderById: (id) => axiosInstance.get(`/sales/${id}`),
  createSalesOrder: (data) => axiosInstance.post('/sales', data),
  updateSalesOrder: (id, data) => axiosInstance.put(`/sales/${id}`, data),
  confirmSalesOrder: (id) => axiosInstance.patch(`/sales/${id}/confirm`),
  cancelSalesOrder: (id) => axiosInstance.patch(`/sales/${id}/cancel`),
  getSalesStats: () => axiosInstance.get('/sales/stats'),
  getSalesAnalytics: () => axiosInstance.get('/sales/analytics'),
}
