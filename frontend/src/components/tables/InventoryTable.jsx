import DataTable from './DataTable'
import Badge from '../common/Badge'
import { formatNumber, enumToLabel } from '../../utils/formatters'
import { TrendingUp, TrendingDown, Lock, Unlock, Edit2, AlertTriangle } from 'lucide-react'

const InventoryTable = ({ data, isLoading, onAdjust, onQuickOp, canWrite }) => {
  const columns = [
    {
      key: 'productId',
      label: 'Product',
      render: (product) => (
        <div>
          <p className="font-medium text-white">{product?.productName || '—'}</p>
          <span className="font-mono text-xs text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
            {product?.sku}
          </span>
        </div>
      ),
    },
    {
      key: 'productId',
      label: 'Type',
      render: (product) => {
        const colors = { FINISHED_GOOD: 'info', RAW_MATERIAL: 'purple', COMPONENT: 'warning' }
        return product ? (
          <Badge variant={colors[product.productType] || 'info'}>{enumToLabel(product.productType)}</Badge>
        ) : '—'
      },
    },
    {
      key: 'onHandQty',
      label: 'On Hand',
      render: (val) => <span className="font-semibold text-white">{formatNumber(val)}</span>,
    },
    {
      key: 'reservedQty',
      label: 'Reserved',
      render: (val) => <span className="text-amber-400 font-medium">{formatNumber(val)}</span>,
    },
    {
      key: 'freeToUseQty',
      label: 'Free to Use',
      render: (val, row) => {
        const free = val !== undefined ? val : Math.max(0, (row.onHandQty || 0) - (row.reservedQty || 0))
        return <span className="font-semibold text-emerald-400">{formatNumber(free)}</span>
      },
    },
    {
      key: 'minimumStockLevel',
      label: 'Min Level',
      render: (val) => <span className="text-slate-400">{formatNumber(val)}</span>,
    },
    {
      key: 'stockStatus',
      label: 'Status',
      render: (val, row) => (
        <div className="flex items-center gap-1.5">
          <Badge variant={val}>{val?.replace('_', ' ')}</Badge>
          {val === 'LOW_STOCK' && (
            <AlertTriangle size={13} className="text-amber-400 animate-pulse-slow" />
          )}
        </div>
      ),
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        canWrite ? (
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => onQuickOp?.('increase', row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              title="Increase Stock"
            >
              <TrendingUp size={14} />
            </button>
            <button
              onClick={() => onQuickOp?.('decrease', row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Decrease Stock"
            >
              <TrendingDown size={14} />
            </button>
            <button
              onClick={() => onQuickOp?.('reserve', row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
              title="Reserve Stock"
            >
              <Lock size={14} />
            </button>
            <button
              onClick={() => onQuickOp?.('release', row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
              title="Release Stock"
            >
              <Unlock size={14} />
            </button>
            <button
              onClick={() => onAdjust(row)}
              className="ml-1 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 border border-slate-700 hover:border-primary-500/30 transition-all"
              title="Set values directly"
            >
              <Edit2 size={12} /> Set
            </button>
          </div>
        ) : null
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyTitle="No inventory records"
      emptyDescription="Inventory records are created automatically when products are added."
    />
  )
}

export default InventoryTable
