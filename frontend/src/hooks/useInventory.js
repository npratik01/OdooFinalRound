import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../api/inventory.api'
import toast from 'react-hot-toast'

const INVENTORY_KEY = 'inventory'
const LOW_STOCK_KEY = 'low-stock'

export const useInventory = (params = {}) => {
  return useQuery({
    queryKey: [INVENTORY_KEY, params],
    queryFn: () => inventoryApi.getAllInventory(params).then((r) => r.data),
    keepPreviousData: true,
  })
}

export const useInventoryByProduct = (productId) => {
  return useQuery({
    queryKey: [INVENTORY_KEY, productId],
    queryFn: () => inventoryApi.getInventoryByProductId(productId).then((r) => r.data.data),
    enabled: !!productId,
  })
}

export const useLowStockItems = () => {
  return useQuery({
    queryKey: [LOW_STOCK_KEY],
    queryFn: () => inventoryApi.getLowStockItems().then((r) => r.data),
    refetchInterval: 1000 * 60 * 2,
  })
}

const invalidateAll = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY] })
  queryClient.invalidateQueries({ queryKey: [LOW_STOCK_KEY] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}

export const useAdjustInventory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, data }) => inventoryApi.adjustInventory(productId, data).then((r) => r.data.data),
    onSuccess: () => { invalidateAll(queryClient); toast.success('Inventory adjusted successfully') },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to adjust inventory'),
  })
}

export const useIncreaseStock = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, qty }) => inventoryApi.increaseStock(productId, qty).then((r) => r.data.data),
    onSuccess: (_, { qty }) => { invalidateAll(queryClient); toast.success(`Stock increased by ${qty} units`) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to increase stock'),
  })
}

export const useDecreaseStock = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, qty }) => inventoryApi.decreaseStock(productId, qty).then((r) => r.data.data),
    onSuccess: (_, { qty }) => { invalidateAll(queryClient); toast.success(`Stock decreased by ${qty} units`) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to decrease stock'),
  })
}

export const useReserveStock = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, qty }) => inventoryApi.reserveStock(productId, qty).then((r) => r.data.data),
    onSuccess: (_, { qty }) => { invalidateAll(queryClient); toast.success(`${qty} units reserved`) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reserve stock'),
  })
}

export const useReleaseStock = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, qty }) => inventoryApi.releaseStock(productId, qty).then((r) => r.data.data),
    onSuccess: (_, { qty }) => { invalidateAll(queryClient); toast.success(`${qty} units released`) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to release stock'),
  })
}
