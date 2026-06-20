import { useQuery } from '@tanstack/react-query'
import { inventoryMovementApi } from '../api/inventoryMovement.api'

const MOVEMENTS_KEY = 'inventory-movements'

export const useInventoryMovements = (params = {}) => {
  return useQuery({
    queryKey: [MOVEMENTS_KEY, params],
    queryFn: () => inventoryMovementApi.getMovements(params).then((r) => r.data),
    keepPreviousData: true,
  })
}
