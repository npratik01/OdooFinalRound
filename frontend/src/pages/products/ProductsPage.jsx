import { useState } from 'react'
import { Plus, Search, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../../hooks/useProducts'
import { useAuth } from '../../context/AuthContext'
import { PRODUCT_WRITE_ROLES } from '../../constants/roles'
import ProductTable from '../../components/tables/ProductTable'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ProductForm from '../../components/forms/ProductForm'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'

const PRODUCT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'FINISHED_GOOD', label: 'Finished Good' },
  { value: 'RAW_MATERIAL', label: 'Raw Material' },
  { value: 'COMPONENT', label: 'Component' },
]

const PROCUREMENT_STRATEGY_OPTIONS = [
  { value: '', label: 'All Strategies' },
  { value: 'MTS', label: 'Make to Stock (MTS)' },
  { value: 'MTO', label: 'Make to Order (MTO)' },
]

const PROCUREMENT_TYPE_OPTIONS = [
  { value: '', label: 'All Proc. Types' },
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'productName', label: 'Product Name' },
  { value: 'sku', label: 'SKU' },
  { value: 'salesPrice', label: 'Sales Price' },
  { value: 'costPrice', label: 'Cost Price' },
]

const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
]

const defaultFilters = {
  search: '',
  sku: '',
  productType: '',
  procurementStrategy: '',
  procurementType: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

const ProductsPage = () => {
  const { hasRole } = useAuth()
  const canWrite = hasRole(PRODUCT_WRITE_ROLES)

  const [filters, setFilters] = useState(defaultFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page, setPage] = useState(1)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState({ open: false, product: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null })

  const queryParams = {
    search: filters.search || undefined,
    sku: filters.sku || undefined,
    productType: filters.productType || undefined,
    procurementStrategy: filters.procurementStrategy || undefined,
    procurementType: filters.procurementType || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page,
    limit: 10,
  }

  const { data, isLoading } = useProducts(queryParams)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    setPage(1)
  }

  const hasActiveFilters = filters.sku || filters.productType || filters.procurementStrategy || filters.procurementType

  const handleCreate = async (formData) => {
    await createProduct.mutateAsync(formData)
    setCreateModal(false)
  }

  const handleUpdate = async (formData) => {
    await updateProduct.mutateAsync({ id: editModal.product._id, data: formData })
    setEditModal({ open: false, product: null })
  }

  const handleDelete = async () => {
    await deleteProduct.mutateAsync(deleteDialog.product._id)
    setDeleteDialog({ open: false, product: null })
  }

  const meta = data?.meta || {}

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">
            {meta.total ?? 0} products in catalog
          </p>
        </div>
        {canWrite && (
          <Button leftIcon={<Plus size={16} />} onClick={() => setCreateModal(true)}>
            Add Product
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4 space-y-4">
        {/* Primary search row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by name, description, vendor..."
            leftIcon={<Search size={15} />}
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            containerClassName="flex-1"
          />
          <Input
            placeholder="Search by SKU (e.g. PRD-202606)"
            leftIcon={<Search size={15} />}
            value={filters.sku}
            onChange={(e) => setFilter('sku', e.target.value)}
            containerClassName="sm:max-w-56"
          />
          <div className="flex gap-2 shrink-0">
            <Button
              variant={showAdvanced ? 'primary' : 'secondary'}
              size="md"
              leftIcon={<SlidersHorizontal size={15} />}
              onClick={() => setShowAdvanced((s) => !s)}
            >
              Filters {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
            </Button>
            {(filters.search || filters.sku || hasActiveFilters) && (
              <Button variant="ghost" size="md" leftIcon={<RotateCcw size={14} />} onClick={resetFilters}>
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-700 animate-fade-in">
            <Select
              label="Product Type"
              options={PRODUCT_TYPE_OPTIONS}
              value={filters.productType}
              onChange={(e) => setFilter('productType', e.target.value)}
              placeholder={null}
            />
            <Select
              label="Procurement Strategy"
              options={PROCUREMENT_STRATEGY_OPTIONS}
              value={filters.procurementStrategy}
              onChange={(e) => setFilter('procurementStrategy', e.target.value)}
              placeholder={null}
            />
            <Select
              label="Procurement Type"
              options={PROCUREMENT_TYPE_OPTIONS}
              value={filters.procurementType}
              onChange={(e) => setFilter('procurementType', e.target.value)}
              placeholder={null}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Sort By"
                options={SORT_OPTIONS}
                value={filters.sortBy}
                onChange={(e) => setFilter('sortBy', e.target.value)}
                placeholder={null}
              />
              <Select
                label="Order"
                options={SORT_ORDER_OPTIONS}
                value={filters.sortOrder}
                onChange={(e) => setFilter('sortOrder', e.target.value)}
                placeholder={null}
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <ProductTable
          data={data?.data || []}
          isLoading={isLoading}
          onEdit={(p) => setEditModal({ open: true, product: p })}
          onDelete={(p) => setDeleteDialog({ open: true, product: p })}
          canWrite={canWrite}
        />
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Page {meta.page} of {meta.totalPages} ({meta.total} records)
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={!meta.hasPrevPage}>Previous</Button>
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={!meta.hasNextPage}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Product" size="lg">
        <ProductForm onSubmit={handleCreate} isLoading={createProduct.isPending} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, product: null })} title="Edit Product" size="lg">
        {editModal.product && (
          <ProductForm
            onSubmit={handleUpdate}
            defaultValues={editModal.product}
            isLoading={updateProduct.isPending}
            isEdit
          />
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null })}
        onConfirm={handleDelete}
        title="Deactivate Product"
        message={`Deactivate "${deleteDialog.product?.productName}"? It will be hidden from active listings.`}
        confirmLabel="Deactivate"
        isLoading={deleteProduct.isPending}
      />
    </div>
  )
}

export default ProductsPage
