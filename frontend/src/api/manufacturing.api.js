import axiosInstance from './axiosInstance'

export const manufacturingApi = {
  getManufacturingOrders:    (params) => axiosInstance.get('/manufacturing', { params }),
  getManufacturingOrderById: (id)     => axiosInstance.get(`/manufacturing/${id}`),
  createManufacturingOrder:  (data)   => axiosInstance.post('/manufacturing', data),
  confirmManufacturingOrder: (id)     => axiosInstance.patch(`/manufacturing/${id}/confirm`),
  startProduction:           (id)     => axiosInstance.patch(`/manufacturing/${id}/start`),
  produceOutput:             (id, data) => axiosInstance.post(`/manufacturing/${id}/produce`, data),
  cancelManufacturingOrder:  (id)     => axiosInstance.patch(`/manufacturing/${id}/cancel`),
  rejectManufacturingOrder:  (id, data) => axiosInstance.patch(`/manufacturing/${id}/reject`, data),
  getDashboardStats:         ()       => axiosInstance.get('/manufacturing/dashboard'),
}
