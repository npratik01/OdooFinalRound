import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/user.api'
import toast from 'react-hot-toast'

const USERS_KEY = 'users'

export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: [USERS_KEY, params],
    queryFn: () => userApi.getUsers(params).then((r) => r.data),
    keepPreviousData: true,
  })
}

export const useUser = (id) => {
  return useQuery({
    queryKey: [USERS_KEY, id],
    queryFn: () => userApi.getUserById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => userApi.createUser(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success('User created successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create user'),
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => userApi.updateUser(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success('User updated successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update user'),
  })
}

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }) => userApi.updateUserStatus(id, isActive).then((r) => r.data.data),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update user status'),
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => userApi.deleteUser(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success('User deactivated successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to deactivate user'),
  })
}
