import axiosInstance from './axiosInstance'

export const workCenterApi = {
  getWorkCenters:      (params) => axiosInstance.get('/work-centers', { params }),
  getWorkCenterById:   (id)     => axiosInstance.get(`/work-centers/${id}`),
  createWorkCenter:    (data)   => axiosInstance.post('/work-centers', data),
  updateWorkCenter:    (id, data) => axiosInstance.put(`/work-centers/${id}`, data),
  toggleWorkCenter:    (id)     => axiosInstance.patch(`/work-centers/${id}/toggle`),
}
