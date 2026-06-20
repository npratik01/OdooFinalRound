import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '../api/sales.api'
import { deliveryApi } from '../api/delivery.api'
import toast from 'react-hot-toast'

const SALES_KEY = 'sales'
const DELIVERIES_KEY = 'deliveries'

export const useSalesOrders = (params = {}) => {
  return useQuery({
    queryKey: [SALES_KEY, params],
    queryFn: () => salesApi.getSalesOrders(params).then((r) => r.data),
    keepPreviousData: true,
  })
}

export const useSalesOrder = (id) => {
  return useQuery({
    queryKey: [SALES_KEY, id],
    queryFn: () => salesApi.getSalesOrderById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export const useCreateSalesOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => salesApi.createSalesOrder(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] })
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sales-analytics'] })
      toast.success('Sales Order created successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create sales order'),
  })
}

export const useUpdateSalesOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => salesApi.updateSalesOrder(id, data).then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] })
      queryClient.invalidateQueries({ queryKey: [SALES_KEY, data._id] })
      toast.success('Sales Order updated successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update sales order'),
  })
}

export const useConfirmSalesOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => salesApi.confirmSalesOrder(id).then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] })
      queryClient.invalidateQueries({ queryKey: [SALES_KEY, data._id] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sales-analytics'] })
      toast.success('Sales Order confirmed & stock reserved')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to confirm sales order'),
  })
}

export const useCancelSalesOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => salesApi.cancelSalesOrder(id).then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] })
      queryClient.invalidateQueries({ queryKey: [SALES_KEY, data._id] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sales-analytics'] })
      toast.success('Sales Order cancelled')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel sales order'),
  })
}

export const useSalesStats = () => {
  return useQuery({
    queryKey: ['sales-stats'],
    queryFn: () => salesApi.getSalesStats().then((r) => r.data.data),
  })
}

export const useSalesAnalytics = () => {
  return useQuery({
    queryKey: ['sales-analytics'],
    queryFn: () => salesApi.getSalesAnalytics().then((r) => r.data.data),
  })
}

export const useDeliveries = (params = {}) => {
  return useQuery({
    queryKey: [DELIVERIES_KEY, params],
    queryFn: () => deliveryApi.getDeliveries(params).then((r) => r.data),
    keepPreviousData: true,
  })
}

export const useProcessDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => deliveryApi.processDelivery(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DELIVERIES_KEY] })
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sales-analytics'] })
      toast.success('Delivery dispatched, inventory updated')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to process delivery'),
  })
}
