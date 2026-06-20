import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerApi } from '../api/customer.api'
import toast from 'react-hot-toast'

const CUSTOMERS_KEY = 'customers'

export const useCustomers = (params = {}) => {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, params],
    queryFn: () => customerApi.getCustomers(params).then((r) => r.data),
    keepPreviousData: true,
  })
}

export const useCustomer = (id) => {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, id],
    queryFn: () => customerApi.getCustomerById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export const useCreateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => customerApi.createCustomer(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      toast.success('Customer created successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create customer'),
  })
}

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customerApi.updateCustomer(id, data).then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY, data._id] })
      toast.success('Customer updated successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update customer'),
  })
}

export const useUpdateCustomerStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }) => customerApi.updateCustomerStatus(id, isActive).then((r) => r.data.data),
    onSuccess: (data, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY, data._id] })
      toast.success(`Customer ${isActive ? 'activated' : 'deactivated'} successfully`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update customer status'),
  })
}
