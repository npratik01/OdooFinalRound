import axiosInstance from './axiosInstance'

export const authApi = {
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  getMe: () => axiosInstance.get('/auth/me'),
  logout: () => axiosInstance.post('/auth/logout'),
}
