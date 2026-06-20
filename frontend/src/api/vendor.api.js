import axiosInstance from './axiosInstance'

export const vendorApi = {
  getVendors:          (params) => axiosInstance.get('/vendors', { params }),
  getVendorById:       (id)     => axiosInstance.get(`/vendors/${id}`),
  createVendor:        (data)   => axiosInstance.post('/vendors', data),
  updateVendor:        (id, data) => axiosInstance.put(`/vendors/${id}`, data),
  toggleVendorStatus:  (id)     => axiosInstance.patch(`/vendors/${id}/status`),
}
