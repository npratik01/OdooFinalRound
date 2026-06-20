import axiosInstance from './axiosInstance'

export const inventoryMovementApi = {
  getMovements: (params) => axiosInstance.get('/inventory-movements', { params }),
}
