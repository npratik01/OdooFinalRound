import axiosInstance from './axiosInstance'

export const customerApi = {
  getCustomers: (params) => axiosInstance.get('/customers', { params }),
  getCustomerById: (id) => axiosInstance.get(`/customers/${id}`),
  createCustomer: (data) => axiosInstance.post('/customers', data),
  updateCustomer: (id, data) => axiosInstance.put(`/customers/${id}`, data),
  updateCustomerStatus: (id, isActive) => axiosInstance.patch(`/customers/${id}/status`, { isActive }),
}
