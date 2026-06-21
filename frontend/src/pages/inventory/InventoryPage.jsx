import { useState } from 'react'
import { AlertTriangle, TrendingDown, TrendingUp, Package, Lock, Unlock } from 'lucide-react'
import { useInventory, useAdjustInventory, useIncreaseStock, useDecreaseStock, useReserveStock, useReleaseStock } from '../../hooks/useInventory'
import { useAuth } from '../../context/AuthContext'
import { INVENTORY_WRITE_ROLES } from '../../constants/roles'
import InventoryTable from '../../components/tables/InventoryTable'
import Modal from '../../components/common/Modal'
import InventoryForm from '../../components/forms/InventoryForm'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import AlertBanner from '../../components/common/AlertBanner'
import { formatNumber } from '../../utils/formatters'
import { useForm } from 'react-hook-form'

const STATUS_FILTER = [
  { value: '', label: 'All Statuses' },
  { value: 'NORMAL', label: 'Normal Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock Only' },
]

// Quick stock operation modal
const QuickStockModal = ({ isOpen, onClose, operation, record, onSubmit, isLoading }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { qty: 1 } })

  const opConfig = {
    increase: { label: 'Increase Stock', color: 'text-emerald-400', icon: TrendingUp, hint: 'Adds qty to on-hand stock' },
    decrease: { label: 'Decrease Stock', color: 'text-red-400', icon: TrendingDown, hint: 'Removes qty from free-to-use stock' },
    reserve: { label: 'Reserve Stock', color: 'text-amber-400', icon: Lock, hint: 'Moves qty from free-to-use to reserved' },
    release: { label: 'Release Stock', color: 'text-blue-400', icon: Unlock, hint: 'Moves qty from reserved back to free-to-use' },
  }

  const cfg = opConfig[operation] || opConfig.increase
  const Icon = cfg.icon

  const handleFormSubmit = (data) => {
    onSubmit(Number(data.qty))
    reset()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cfg.label} size="sm">
      {record && (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-xl p-4">
            <p className="font-medium text-white text-sm">{record.productId?.productName}</p>
            <div className="grid grid-cols-3 gap-3 mt-3 text-center">
              <div>
                <p className="text-lg font-bold text-white">{record.onHandQty}</p>
                <p className="text-xs text-slate-500">On Hand</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-400">{record.reservedQty}</p>
                <p className="text-xs text-slate-500">Reserved</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-400">{Math.max(0, (record.onHandQty || 0) - (record.reservedQty || 0))}</p>
                <p className="text-xs text-slate-500">Free</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <Input
              label={<span className={cfg.color}>{cfg.label} — Quantity</span>}
              type="number"
              min="1"
              step="1"
              required
              hint={cfg.hint}
              error={errors.qty?.message}
              leftIcon={<Icon size={15} className={cfg.color} />}
              {...register('qty', {
                required: 'Quantity is required',
                min: { value: 1, message: 'Must be at least 1' },
                valueAsNumber: true,
              })}
            />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose} type="button">Cancel</Button>
              <Button className="flex-1" isLoading={isLoading} type="submit">{cfg.label}</Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  )
}

const InventoryPage = () => {
  const { hasRole } = useAuth()
  const canWrite = hasRole(INVENTORY_WRITE_ROLES)

  const [search, setSearch] = useState('')
  const [stockStatusFilter, setStockStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [adjustModal, setAdjustModal] = useState({ open: false, record: null })
  const [quickOp, setQuickOp] = useState({ open: false, operation: null, record: null })

  const { data, isLoading } = useInventory({ search: search || undefined, stockStatus: stockStatusFilter || undefined, page, limit: 10 })

  const adjustInventory = useAdjustInventory()
  const increaseStock = useIncreaseStock()
  const decreaseStock = useDecreaseStock()
  const reserveStock = useReserveStock()
  const releaseStock = useReleaseStock()

  const handleAdjust = async (formData) => {
    await adjustInventory.mutateAsync({ productId: adjustModal.record.productId?._id, data: formData })
    setAdjustModal({ open: false, record: null })
  }

  const handleQuickOp = async (qty) => {
    const productId = quickOp.record.productId?._id
    const ops = { increase: increaseStock, decrease: decreaseStock, reserve: reserveStock, release: releaseStock }
    await ops[quickOp.operation].mutateAsync({ productId, qty })
    setQuickOp({ open: false, operation: null, record: null })
  }

  const getQuickOpLoading = () => {
    const ops = { increase: increaseStock, decrease: decreaseStock, reserve: reserveStock, release: releaseStock }
    return ops[quickOp.operation]?.isPending || false
  }

  const allData = data?.data || []
  const lowStockCount = allData.filter((i) => i.stockStatus === 'LOW_STOCK').length
  const meta = data?.meta || {}

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">
            {meta.total ?? 0} products tracked
            {lowStockCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
                <AlertTriangle size={12} /> {lowStockCount} low stock on this page
              </span>
            )}
          </p>
        </div>
      </div>

      {lowStockCount > 0 && !stockStatusFilter && (
        <AlertBanner
          variant="warning"
          title={`${lowStockCount} item${lowStockCount !== 1 ? 's' : ''} below minimum stock level`}
          message="These products need restocking. Click 'Increase' to add stock."
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          id="search-inventory"
          placeholder="Search by product name or SKU..."
          defaultValue={search}
          onSearch={(val) => { setSearch(val); setPage(1) }}
          className="flex-1"
        />
        <Select
          options={STATUS_FILTER}
          value={stockStatusFilter}
          onChange={(e) => { setStockStatusFilter(e.target.value); setPage(1) }}
          containerClassName="sm:max-w-56"
          placeholder={null}
        />
      </div>

      {/* Table */}
      <div className="card">
        <InventoryTable
          data={allData}
          isLoading={isLoading}
          onAdjust={(record) => setAdjustModal({ open: true, record })}
          onQuickOp={(operation, record) => setQuickOp({ open: true, operation, record })}
          canWrite={canWrite}
        />
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <p className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={!meta.hasPrevPage}>Previous</Button>
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={!meta.hasNextPage}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      <Modal
        isOpen={adjustModal.open}
        onClose={() => setAdjustModal({ open: false, record: null })}
        title={`Adjust Inventory — ${adjustModal.record?.productId?.productName || ''}`}
      >
        {adjustModal.record && (
          <InventoryForm
            onSubmit={handleAdjust}
            currentInventory={adjustModal.record}
            isLoading={adjustInventory.isPending}
          />
        )}
      </Modal>

      {/* Quick Stock Operation Modal */}
      <QuickStockModal
        isOpen={quickOp.open}
        onClose={() => setQuickOp({ open: false, operation: null, record: null })}
        operation={quickOp.operation}
        record={quickOp.record}
        onSubmit={handleQuickOp}
        isLoading={getQuickOpLoading()}
      />
    </div>
  )
}

export default InventoryPage
