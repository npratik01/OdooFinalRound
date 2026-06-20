import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, AlertTriangle, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useProduct, useUpdateProduct } from '../../hooks/useProducts'
import { useInventoryByProduct, useAdjustInventory, useIncreaseStock } from '../../hooks/useInventory'
import { useAuth } from '../../context/AuthContext'
import { PRODUCT_WRITE_ROLES, INVENTORY_WRITE_ROLES } from '../../constants/roles'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import ProductForm from '../../components/forms/ProductForm'
import InventoryForm from '../../components/forms/InventoryForm'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { formatCurrency, enumToLabel, formatDate } from '../../utils/formatters'
import { useForm } from 'react-hook-form'
import Input from '../../components/common/Input'

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const canWriteProduct = hasRole(PRODUCT_WRITE_ROLES)
  const canWriteInventory = hasRole(INVENTORY_WRITE_ROLES)
  const [editModal, setEditModal] = useState(false)
  const [inventoryModal, setInventoryModal] = useState(false)
  const [restockModal, setRestockModal] = useState(false)

  const { data: product, isLoading } = useProduct(id)
  const { data: inventory } = useInventoryByProduct(id)
  const updateProduct = useUpdateProduct()
  const adjustInventory = useAdjustInventory()
  const increaseStock = useIncreaseStock()

  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { qty: 1 } })

  if (isLoading) return <PageLoader />
  if (!product) return <div className="text-slate-400 p-6">Product not found</div>

  const inv = inventory || product?.inventory
  const isLowStock = inv && inv.stockStatus === 'LOW_STOCK'
  const deficit = inv ? Math.max(0, (inv.minimumStockLevel || 0) - (inv.onHandQty || 0)) : 0

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to Products
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">{product.productName}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">{product.sku}</span>
              <Badge variant={product.productType}>{enumToLabel(product.productType)}</Badge>
              <Badge variant={product.isActive ? 'active' : 'inactive'}>{product.isActive ? 'Active' : 'Inactive'}</Badge>
              {isLowStock && <Badge variant="LOW_STOCK">⚠ Low Stock</Badge>}
            </div>
          </div>
          {canWriteProduct && (
            <Button leftIcon={<Edit2 size={15} />} onClick={() => setEditModal(true)}>Edit Product</Button>
          )}
        </div>
      </div>

      {/* LOW STOCK ALERT BANNER — Step 10 */}
      {isLowStock && (
        <div className="flex items-start gap-4 p-5 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="text-amber-400 animate-pulse-slow" size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-300">Low Stock Alert</p>
            <p className="text-sm text-amber-200/70 mt-1">
              Current stock ({inv.onHandQty} units) is at or below the minimum threshold ({inv.minimumStockLevel} units).
              {deficit > 0 && ` You need at least ${deficit} more unit${deficit !== 1 ? 's' : ''} to reach the minimum.`}
            </p>
          </div>
          {canWriteInventory && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<TrendingUp size={14} />}
              onClick={() => setRestockModal(true)}
              className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 shrink-0"
            >
              Restock Now
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product details */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm border-b border-slate-700 pb-3">Product Details</h2>
          {[
            ['Product Name', product.productName],
            ['Sales Price', formatCurrency(product.salesPrice)],
            ['Cost Price', formatCurrency(product.costPrice)],
            ['Product Type', enumToLabel(product.productType)],
            ['Procurement Strategy', product.procurementStrategy],
            ['Procurement Type', enumToLabel(product.procurementType)],
            ['Vendor', product.vendor || '—'],
            ['Created By', product.createdBy?.name || '—'],
            ['Created At', formatDate(product.createdAt)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-200 font-medium">{value}</span>
            </div>
          ))}
          {product.description && (
            <div className="pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-300">{product.description}</p>
            </div>
          )}
        </div>

        {/* Inventory */}
        <div className={`card p-5 space-y-4 ${isLowStock ? 'border-amber-500/30' : ''}`}>
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h2 className="font-semibold text-white text-sm">Inventory</h2>
            {canWriteInventory && (
              <Button size="sm" variant="secondary" leftIcon={<Edit2 size={13} />} onClick={() => setInventoryModal(true)}>Adjust</Button>
            )}
          </div>
          {inv ? (
            <>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'On Hand', value: inv.onHandQty ?? 0, color: isLowStock ? 'text-amber-400' : 'text-white' },
                  { label: 'Reserved', value: inv.reservedQty ?? 0, color: 'text-amber-400' },
                  { label: 'Free to Use', value: inv.freeToUseQty ?? Math.max(0, (inv.onHandQty ?? 0) - (inv.reservedQty ?? 0)), color: 'text-emerald-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-900 rounded-xl p-3">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm pt-2">
                <span className="text-slate-500">Minimum Stock Level</span>
                <span className="text-slate-200 font-medium">{inv.minimumStockLevel}</span>
              </div>
              {isLowStock && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Deficit</span>
                  <span className="text-red-400 font-bold">-{deficit} units needed</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stock Status</span>
                <Badge variant={inv.stockStatus}>{inv.stockStatus?.replace('_', ' ')}</Badge>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm">No inventory record found.</p>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Product" size="lg">
        <ProductForm
          onSubmit={async (data) => { await updateProduct.mutateAsync({ id, data }); setEditModal(false) }}
          defaultValues={product}
          isLoading={updateProduct.isPending}
          isEdit
        />
      </Modal>

      {/* Adjust Inventory Modal */}
      <Modal isOpen={inventoryModal} onClose={() => setInventoryModal(false)} title="Adjust Inventory">
        <InventoryForm
          onSubmit={async (data) => { await adjustInventory.mutateAsync({ productId: id, data }); setInventoryModal(false) }}
          currentInventory={inv}
          isLoading={adjustInventory.isPending}
        />
      </Modal>

      {/* Quick Restock Modal (from Low Stock Alert) */}
      <Modal isOpen={restockModal} onClose={() => setRestockModal(false)} title="Quick Restock" size="sm">
        <div className="space-y-4">
          {isLowStock && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm">
              <p className="text-amber-300 font-medium">Minimum needed: {deficit} units</p>
              <p className="text-amber-200/60 text-xs mt-1">Enter quantity to add to on-hand stock</p>
            </div>
          )}
          <form onSubmit={handleSubmit(async ({ qty }) => {
            await increaseStock.mutateAsync({ productId: id, qty: Number(qty) })
            setRestockModal(false)
          })} className="space-y-4">
            <Input
              label="Quantity to Add"
              type="number"
              min="1"
              step="1"
              required
              leftIcon={<TrendingUp size={15} className="text-emerald-400" />}
              error={errors.qty?.message}
              {...register('qty', { required: 'Required', min: { value: 1, message: 'Must be at least 1' }, valueAsNumber: true })}
            />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setRestockModal(false)} type="button">Cancel</Button>
              <Button className="flex-1" isLoading={increaseStock.isPending} type="submit">Add Stock</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}

export default ProductDetailPage
