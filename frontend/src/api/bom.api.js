import axiosInstance from './axiosInstance'

export const bomApi = {
  getBoms:         (params) => axiosInstance.get('/bom', { params }),
  getBomById:      (id)     => axiosInstance.get(`/bom/${id}`),
  getBomByProduct: (productId) => axiosInstance.get(`/bom/product/${productId}`),
  createBom:       (data)   => axiosInstance.post('/bom', data),
  updateBom:       (id, data) => axiosInstance.put(`/bom/${id}`, data),
  deactivateBom:   (id)     => axiosInstance.patch(`/bom/${id}/deactivate`),
}
