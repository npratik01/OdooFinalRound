import axiosInstance from './axiosInstance'

export const userApi = {
  getUsers: (params) => axiosInstance.get('/users', { params }),
  getUserById: (id) => axiosInstance.get(`/users/${id}`),
  createUser: (data) => axiosInstance.post('/users', data),
  updateUser: (id, data) => axiosInstance.put(`/users/${id}`, data),
  patchUser: (id, data) => axiosInstance.patch(`/users/${id}`, data),
  updateUserStatus: (id, isActive) => axiosInstance.patch(`/users/${id}/status`, { isActive }),
  deleteUser: (id) => axiosInstance.delete(`/users/${id}`),
}
