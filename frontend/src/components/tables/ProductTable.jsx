import { useNavigate } from 'react-router-dom'
import { Edit2, Trash2, Eye } from 'lucide-react'
import DataTable from './DataTable'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { formatCurrency, enumToLabel, formatDate } from '../../utils/formatters'
import { buildRoute } from '../../constants/routes'

const ProductTable = ({ data, isLoading, onEdit, onDelete, canWrite }) => {
  const navigate = useNavigate()

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      render: (val) => (
        <span className="font-mono text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">{val}</span>
      ),
    },
    {
      key: 'productName',
      label: 'Product Name',
      render: (val, row) => (
        <div>
          <p className="font-medium text-white">{val}</p>
          {row.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'productType',
      label: 'Type',
      render: (val) => {
        const colors = {
          FINISHED_GOOD: 'info',
          RAW_MATERIAL: 'purple',
          COMPONENT: 'warning',
        }
        return <Badge variant={colors[val] || 'info'}>{enumToLabel(val)}</Badge>
      },
    },
    {
      key: 'procurementStrategy',
      label: 'Strategy',
      render: (val) => <Badge variant="info">{val}</Badge>,
    },
    {
      key: 'costPrice',
      label: 'Cost Price',
      render: (val) => <span className="text-slate-300">{formatCurrency(val)}</span>,
    },
    {
      key: 'salesPrice',
      label: 'Sales Price',
      render: (val) => <span className="font-medium text-white">{formatCurrency(val)}</span>,
    },
    {
      key: 'inventory',
      label: 'Stock Status',
      render: (inv) => {
        if (!inv) return <Badge variant="inactive">No Inventory</Badge>
        return (
          <div className="flex flex-col gap-1">
            <Badge variant={inv.stockStatus}>{inv.stockStatus?.replace('_', ' ')}</Badge>
            <span className="text-xs text-slate-500">{inv.onHandQty} units</span>
          </div>
        )
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => <Badge variant={val ? 'active' : 'inactive'}>{val ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(buildRoute.productDetail(row._id))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
            title="View details"
          >
            <Eye size={15} />
          </button>
          {canWrite && (
            <>
              <button
                onClick={() => onEdit(row)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                title="Edit"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => onDelete(row)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Deactivate"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyTitle="No products found"
      emptyDescription="Create your first product to get started."
    />
  )
}

export default ProductTable
