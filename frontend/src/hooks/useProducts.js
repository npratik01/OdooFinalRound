import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productApi } from '../api/product.api'
import toast from 'react-hot-toast'

const PRODUCTS_KEY = 'products'

export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () => productApi.getProducts(params).then((r) => r.data),
    keepPreviousData: true,
  })
}

export const useProduct = (id) => {
  return useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => productApi.getProductById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => productApi.createProduct(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Product created successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create product'),
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => productApi.updateProduct(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      toast.success('Product updated successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update product'),
  })
}

export const useUpdateProductStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }) => productApi.updateProductStatus(id, isActive).then((r) => r.data.data),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`Product ${isActive ? 'activated' : 'deactivated'} successfully`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update product status'),
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => productApi.deleteProduct(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Product deactivated successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to deactivate product'),
  })
}
