import axiosInstance from './axiosInstance'

export const productApi = {
  getProducts: (params) => axiosInstance.get('/products', { params }),
  getProductById: (id) => axiosInstance.get(`/products/${id}`),
  createProduct: (data) => axiosInstance.post('/products', data),
  updateProduct: (id, data) => axiosInstance.put(`/products/${id}`, data),
  patchProduct: (id, data) => axiosInstance.patch(`/products/${id}`, data),
  updateProductStatus: (id, isActive) => axiosInstance.patch(`/products/${id}/status`, { isActive }),
  deleteProduct: (id) => axiosInstance.delete(`/products/${id}`),
}
