import axiosInstance from './axiosInstance'

export const purchaseApi = {
  getPurchaseOrders:    (params) => axiosInstance.get('/purchase-orders', { params }),
  getPurchaseOrderById: (id)     => axiosInstance.get(`/purchase-orders/${id}`),
  createPurchaseOrder:  (data)   => axiosInstance.post('/purchase-orders', data),
  updatePurchaseOrder:  (id, data) => axiosInstance.put(`/purchase-orders/${id}`, data),
  confirmPurchaseOrder: (id)     => axiosInstance.patch(`/purchase-orders/${id}/confirm`),
  cancelPurchaseOrder:  (id)     => axiosInstance.patch(`/purchase-orders/${id}/cancel`),
  receiveGoods:         (id, data) => axiosInstance.post(`/purchase-orders/${id}/receive`, data),
  getReceiptsByPO:      (id)     => axiosInstance.get(`/purchase-orders/${id}/receipts`),
}
