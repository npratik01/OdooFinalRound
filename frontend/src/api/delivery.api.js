import axiosInstance from './axiosInstance'

export const deliveryApi = {
  getDeliveries: (params) => axiosInstance.get('/deliveries', { params }),
  processDelivery: (data) => axiosInstance.post('/deliveries', data),
}
