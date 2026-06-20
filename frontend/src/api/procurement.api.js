import axiosInstance from './axiosInstance'

export const procurementApi = {
  getDashboard:          () => axiosInstance.get('/procurement/dashboard'),
  getAnalytics:          () => axiosInstance.get('/procurement/analytics'),
  getSupplierPerformance:() => axiosInstance.get('/procurement/supplier-performance'),
  getLowStockInsights:   () => axiosInstance.get('/procurement/low-stock-insights'),
}
