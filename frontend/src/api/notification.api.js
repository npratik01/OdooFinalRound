import axiosInstance from './axiosInstance'

export const notificationApi = {
  getNotifications: (params) => axiosInstance.get('/notifications', { params }),
  markAsRead: (id) => axiosInstance.patch(`/notifications/${id}/read`),
  markAllAsRead: () => axiosInstance.post('/notifications/read-all'),
}
