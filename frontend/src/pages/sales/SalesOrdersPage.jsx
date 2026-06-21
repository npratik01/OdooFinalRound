import { useState, useEffect } from 'react'
import { useSalesOrders, useCreateSalesOrder, useUpdateSalesOrder } from '../../hooks/useSales'
import { useCustomers, useCustomer } from '../../hooks/useCustomers'
import { useProducts } from '../../hooks/useProducts'
import { Link } from 'react-router-dom'
import SearchableSelect from '../../components/common/SearchableSelect'
import { Plus, Search, Eye, Edit3, Trash2, Filter } from 'lucide-react'
import DataTable from '../../components/tables/DataTable'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import AvailabilityIndicator from '../../components/sales/AvailabilityIndicator'
import OrderSummary from '../../components/sales/OrderSummary'
import { buildRoute } from '../../constants/routes'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'
import toast from 'react-hot-toast'

// ─── Status badge helper ───────────────────────────────────────────────────────
const getStatusColor = (status) => {
  const map = {
    Draft: 'slate',
    Confirmed: 'indigo',
    'Partially Delivered': 'amber',
    'Fully Delivered': 'emerald',
    Cancelled: 'red',
  }
  return map[status] || 'slate'
}

// ─── Sales Order Form (shared Create / Edit) ──────────────────────────────────
const SalesOrderForm = ({
  customers = [],
  products = [],
  initialValues = null,
  onSubmit,
  isLoading = false,
  onCancel,
  submitLabel = 'Save as Draft',
}) => {
  const [customerId, setCustomerId] = useState(
    initialValues?.customerId?._id || initialValues?.customerId || ''
  )
  const [customerSearch, setCustomerSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(customerSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [customerSearch])

  // Get active customers matching the search term (limit 50 to scale)
  const { data: customersData, isLoading: isCustomersLoading } = useCustomers({
    isActive: 'true',
    search: debouncedSearch,
    limit: 50,
  })

  // Get current customer if selected (especially useful for editing where the selected customer might not be in search results)
  const { data: selectedCustomer } = useCustomer(customerId)

  // Merge selected customer into options if not already present
  const fetchedCustomers = customersData?.data || []
  const mergedCustomers = [...fetchedCustomers]

  // If we have initialValues?.customerId as an object, let's also merge it directly to avoid a flash of loading
  const initialCustomerObj =
    initialValues?.customerId && typeof initialValues.customerId === 'object'
      ? initialValues.customerId
      : null

  if (initialCustomerObj && !mergedCustomers.some((c) => c._id === initialCustomerObj._id)) {
    mergedCustomers.unshift(initialCustomerObj)
  }
  if (selectedCustomer && !mergedCustomers.some((c) => c._id === selectedCustomer._id)) {
    mergedCustomers.unshift(selectedCustomer)
  }

  const customerOptions = mergedCustomers.map((c) => ({
    value: c._id,
    label: c.customerName,
    sublabel: c.customerCode,
  }))

  const [remarks, setRemarks] = useState(initialValues?.remarks || '')
  const [orderDate, setOrderDate] = useState(
    initialValues?.orderDate
      ? new Date(initialValues.orderDate).toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10)
  )
  const [items, setItems] = useState(
    initialValues?.items?.map((i) => ({
      productId: i.productId?._id || i.productId || '',
      quantity: i.quantity || 1,
      unitPrice: i.unitPrice || 0,
    })) || [{ productId: '', quantity: 1, unitPrice: 0 }]
  )

  const getProduct = (id) => products.find((p) => p._id === id)

  const handleProductChange = (index, productId) => {
    const prod = getProduct(productId)
    const updated = [...items]
    updated[index].productId = productId
    updated[index].unitPrice = prod ? prod.salesPrice : 0
    setItems(updated)
  }

  const handleQtyChange = (index, qty) => {
    const updated = [...items]
    updated[index].quantity = parseInt(qty, 10) || 1
    setItems(updated)
  }

  const handlePriceChange = (index, price) => {
    const updated = [...items]
    updated[index].unitPrice = parseFloat(price) || 0
    setItems(updated)
  }

  const addRow = () => setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }])
  const removeRow = (idx) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!customerId) { toast.error('Please select a customer'); return }
    const invalid = items.some((i) => !i.productId || i.quantity <= 0)
    if (invalid) { toast.error('Fill in all product items with valid quantities'); return }
    onSubmit({ customerId, remarks, orderDate, items })
  }

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Customer + Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <SearchableSelect
            label="Customer *"
            value={customerId}
            onChange={setCustomerId}
            options={customerOptions}
            onSearchChange={setCustomerSearch}
            isLoading={isCustomersLoading}
            placeholder="Select Customer"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Date</label>
          <input
            type="date"
            className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition-colors"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
          />
        </div>
      </div>

      {/* Product Lines */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Lines</h3>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            + Add Product
          </Button>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {items.map((item, idx) => {
            const product = getProduct(item.productId)
            const freeQty = product?.inventory?.freeToUseQty ?? 0

            return (
              <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex gap-3 items-end">
                  {/* Product selector */}
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Product</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      required
                    >
                      <option value="">Select product…</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.productName} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="w-24">
                    <Input
                      label="Qty"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      required
                    />
                  </div>

                  {/* Unit price */}
                  <div className="w-28">
                    <Input
                      label="Unit Price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handlePriceChange(idx, e.target.value)}
                      required
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="w-24 text-right shrink-0">
                    <p className="text-xs text-slate-500 mb-1.5">Subtotal</p>
                    <span className="text-sm text-white font-bold">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    disabled={items.length === 1}
                    className="mb-1 p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Availability indicator */}
                {item.productId && (
                  <AvailabilityIndicator
                    freeQty={freeQty}
                    requestedQty={item.quantity}
                    productName={product?.productName}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Summary</p>
        <OrderSummary items={items} products={products} />
      </div>

      {/* Remarks */}
      <Input
        label="Remarks / Notes"
        placeholder="Add delivery terms, packaging specs, or internal notes..."
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
      />

      {/* Total footer */}
      <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
        <span className="text-slate-400 text-sm">Estimated Total</span>
        <span className="text-xl font-bold text-white">{formatCurrency(calculateTotal())}</span>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const SalesOrdersPage = () => {
  const { hasRole } = useAuth()
  const canWrite = hasRole([ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER])

  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' })
  const { data: salesData, isLoading } = useSalesOrders(params)

  const createOrderMutation = useCreateSalesOrder()
  const updateOrderMutation = useUpdateSalesOrder()

  const { data: productsData } = useProducts({ isActive: true, limit: 200 })
  const products = productsData?.data || []

  const [modalMode, setModalMode] = useState(null) // 'create' | 'edit'
  const [editingOrder, setEditingOrder] = useState(null)

  const openCreateModal = () => {
    setEditingOrder(null)
    setModalMode('create')
  }

  const openEditModal = (order) => {
    setEditingOrder(order)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingOrder(null)
  }

  const handleCreate = (formData) => {
    createOrderMutation.mutate(formData, { onSuccess: closeModal })
  }

  const handleEdit = (formData) => {
    updateOrderMutation.mutate(
      { id: editingOrder._id, data: formData },
      { onSuccess: closeModal }
    )
  }

  const columns = [
    {
      header: 'SO Number',
      accessor: 'soNumber',
      render: (val, row) => (
        <Link
          to={buildRoute.salesDetail(row._id)}
          className="font-mono text-primary-400 font-bold hover:underline text-sm"
        >
          {val}
        </Link>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerId',
      render: (cust) => (
        <div>
          <p className="text-slate-200 font-semibold text-sm">{cust?.customerName || 'N/A'}</p>
          <p className="text-xs text-slate-500">{cust?.customerCode}</p>
        </div>
      ),
    },
    {
      header: 'Order Date',
      accessor: 'orderDate',
      render: (val) => <span className="text-xs text-slate-400">{formatDateTime(val)}</span>,
    },
    {
      header: 'Items',
      accessor: 'items',
      render: (val) => (
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full font-medium">
          {val?.length || 0} items
        </span>
      ),
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      render: (val) => <span className="font-bold text-slate-200">{formatCurrency(val)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status) => <Badge color={getStatusColor(status)} size="sm">{status}</Badge>,
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (id, row) => (
        <div className="flex items-center gap-1.5">
          <Link to={buildRoute.salesDetail(id)}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View details">
              <Eye size={14} className="text-slate-400 hover:text-slate-100" />
            </Button>
          </Link>
          {canWrite && row.status === 'Draft' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Edit draft order"
              onClick={() => openEditModal(row)}
            >
              <Edit3 size={14} className="text-slate-400 hover:text-primary-400" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Orders</h1>
          <p className="text-sm text-slate-400">Create, confirm, and track deliveries for sales contracts.</p>
        </div>
        {canWrite && (
          <Button id="create-sales-order-btn" onClick={openCreateModal} className="flex items-center gap-2">
            <Plus size={16} />
            Create Sales Order
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            id="search-sales"
            placeholder="Search by SO number or customer..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary-500 transition-all"
            value={params.search}
            onChange={(e) => setParams((p) => ({ ...p, search: e.target.value, page: 1 }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500 shrink-0" />
          <select
            id="status-filter"
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-primary-500"
            value={params.status}
            onChange={(e) => setParams((p) => ({ ...p, status: e.target.value, page: 1 }))}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Partially Delivered">Partially Delivered</option>
            <option value="Fully Delivered">Fully Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !salesData?.data || salesData.data.length === 0 ? (
        <EmptyState
          title="No sales orders found"
          description="Create a new sales order to begin stock reservations and delivery tracking."
          action={canWrite && (
            <Button onClick={openCreateModal} className="flex items-center gap-2 mt-4">
              <Plus size={16} /> Create First Order
            </Button>
          )}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <DataTable
            data={salesData.data}
            columns={columns}
            pagination={salesData.meta}
            onPageChange={(page) => setParams((p) => ({ ...p, page }))}
          />
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={!!modalMode}
        onClose={closeModal}
        title={modalMode === 'edit' ? `Edit Order: ${editingOrder?.soNumber}` : 'Create New Sales Order'}
        size="xl"
      >
        {modalMode === 'create' && (
          <SalesOrderForm
            products={products}
            onSubmit={handleCreate}
            isLoading={createOrderMutation.isLoading}
            onCancel={closeModal}
            submitLabel="Save as Draft"
          />
        )}
        {modalMode === 'edit' && editingOrder && (
          <SalesOrderForm
            products={products}
            initialValues={editingOrder}
            onSubmit={handleEdit}
            isLoading={updateOrderMutation.isLoading}
            onCancel={closeModal}
            submitLabel="Save Changes"
          />
        )}
      </Modal>
    </div>
  )
}

export default SalesOrdersPage
