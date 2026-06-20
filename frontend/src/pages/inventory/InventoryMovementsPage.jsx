import { useState } from 'react'
import { useInventoryMovements } from '../../hooks/useInventoryMovements'
import DataTable from '../../components/tables/DataTable'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { formatDateTime } from '../../utils/formatters'

const InventoryMovementsPage = () => {
  const [params, setParams] = useState({ page: 1, limit: 15 })
  const { data, isLoading } = useInventoryMovements(params)

  const columns = [
    {
      header: 'Date & Time',
      accessor: 'createdAt',
      render: (val) => formatDateTime(val),
    },
    {
      header: 'Product',
      accessor: 'productId',
      render: (prod) => (
        <div>
          <p className="font-semibold text-slate-200">{prod?.productName || 'N/A'}</p>
          <span className="text-xs text-slate-500">{prod?.sku || ''}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'movementType',
      render: (type) => {
        let color = 'slate'
        if (type === 'RECEIPT') color = 'emerald'
        if (type === 'DELIVERY') color = 'red'
        if (type === 'ADJUSTMENT') color = 'amber'
        if (type === 'RESERVATION') color = 'indigo'
        if (type === 'RESERVATION_RELEASE') color = 'teal'
        return <Badge color={color} size="sm">{type}</Badge>
      },
    },
    {
      header: 'Qty Change',
      accessor: 'quantity',
      render: (qty) => (
        <span className={`font-semibold ${qty > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {qty > 0 ? `+${qty}` : qty}
        </span>
      ),
    },
    {
      header: 'Document Reference',
      accessor: 'referenceType',
      render: (_, row) => (
        <div>
          <span className="text-sm font-medium text-slate-300">{row.referenceType}</span>
          <p className="text-xs text-slate-500 font-mono truncate max-w-[120px]">{row.referenceId}</p>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: 'remarks',
      render: (desc) => <span className="text-sm text-slate-400">{desc || '—'}</span>,
    },
    {
      header: 'Performed By',
      accessor: 'createdBy',
      render: (user) => (
        <div>
          <span className="text-sm text-slate-300">{user?.name || 'System'}</span>
          <p className="text-xs text-slate-500">{user?.role?.replace('_', ' ') || ''}</p>
        </div>
      ),
    },
  ]

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Stock Movements Log</h1>
          <p className="text-sm text-slate-400">Chronological transaction history of all stock movements and reservations.</p>
        </div>
      </div>

      {!data?.data || data.data.length === 0 ? (
        <EmptyState title="No movements logged yet" description="All manual adjustments, confirmations, and deliveries are tracked here." />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <DataTable
            data={data.data}
            columns={columns}
            pagination={data.meta}
            onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
          />
        </div>
      )}
    </div>
  )
}

export default InventoryMovementsPage
