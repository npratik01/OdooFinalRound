import { useState } from 'react'
import { useSalesOrders, useCreateSalesOrder } from '../../hooks/useSales'
import { useCustomers } from '../../hooks/useCustomers'
import { useProducts } from '../../hooks/useProducts'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye, Trash2 } from 'lucide-react'
import DataTable from '../../components/tables/DataTable'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { buildRoute } from '../../constants/routes'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

const SalesOrdersPage = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' })
  const { data: salesData, isLoading } = useSalesOrders(params)
  
  const createOrderMutation = useCreateSalesOrder()
  
  // Fetch customers & products for creation dropdowns
  const { data: customersData } = useCustomers({ isActive: true, limit: 100 })
  const { data: productsData } = useProducts({ isActive: true, limit: 100 })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [remarks, setRemarks] = useState('')
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitPrice: 0 }])

  const openCreateModal = () => {
    setSelectedCustomerId('')
    setRemarks('')
    setItems([{ productId: '', quantity: 1, unitPrice: 0 }])
    setIsModalOpen(true)
  }

  const handleProductChange = (index, productId) => {
    const selectedProd = productsData?.products?.find(p => p._id === productId)
    const updated = [...items]
    updated[index].productId = productId
    updated[index].unitPrice = selectedProd ? selectedProd.salesPrice : 0
    setItems(updated)
  }

  const handleItemQtyChange = (index, quantity) => {
    const updated = [...items]
    updated[index].quantity = parseInt(quantity, 10) || 1
    setItems(updated)
  }

  const handleItemPriceChange = (index, price) => {
    const updated = [...items]
    updated[index].unitPrice = parseFloat(price) || 0
    setItems(updated)
  }

  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItemRow = (index) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const handleCreateOrder = (e) => {
    e.preventDefault()
    if (!selectedCustomerId) {
      toast.error('Please select a customer')
      return
    }

    const invalidItem = items.some(item => !item.productId || item.quantity <= 0)
    if (invalidItem) {
      toast.error('Please fill in all product items with valid quantities')
      return
    }

    createOrderMutation.mutate({
      customerId: selectedCustomerId,
      remarks,
      items
    }, {
      onSuccess: () => {
        setIsModalOpen(false)
      }
    })
  }

  const columns = [
    {
      header: 'SO Number',
      accessor: 'soNumber',
      render: (val, row) => (
        <Link to={buildRoute.salesDetail(row._id)} className="font-mono text-primary-400 font-semibold hover:underline">
          {val}
        </Link>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerId',
      render: (cust) => <span className="text-slate-200 font-medium">{cust?.customerName || 'N/A'}</span>,
    },
    {
      header: 'Order Date',
      accessor: 'orderDate',
      render: (val) => formatDateTime(val),
    },
    {
      header: 'Items Count',
      accessor: 'items',
      render: (val) => <span className="text-sm text-slate-400">{val?.length || 0} items</span>,
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      render: (val) => <span className="font-semibold text-slate-200">{formatCurrency(val)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status) => {
        let color = 'slate'
        if (status === 'Draft') color = 'slate'
        if (status === 'Confirmed') color = 'indigo'
        if (status === 'Partially Delivered') color = 'amber'
        if (status === 'Fully Delivered') color = 'emerald'
        if (status === 'Cancelled') color = 'red'
        return <Badge color={color} size="sm">{status}</Badge>
      },
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (id) => (
        <div className="flex items-center gap-2">
          <Link to={buildRoute.salesDetail(id)}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View details">
              <Eye size={15} className="text-slate-400 hover:text-slate-100" />
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Orders</h1>
          <p className="text-sm text-slate-400">Create, confirm, and track deliveries for sales contracts.</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus size={16} />
          Create Sales Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by SO number..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary-500 transition-all duration-200"
            value={params.search}
            onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
          />
        </div>
        <select
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-primary-500"
          value={params.status}
          onChange={(e) => setParams((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Partially Delivered">Partially Delivered</option>
          <option value="Fully Delivered">Fully Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !salesData?.orders || salesData.orders.length === 0 ? (
        <EmptyState title="No sales orders found" description="Create a new sales order to begin stock reservations and shipments." />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <DataTable
            data={salesData.orders}
            columns={columns}
            pagination={salesData.meta}
            onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
          />
        </div>
      )}

      {/* Create Order Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Sales Order" size="lg">
        <form onSubmit={handleCreateOrder} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-300">Customer</label>
              <select
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">Select Customer</option>
                {customersData?.customers?.map(c => (
                  <option key={c._id} value={c._id}>{c.customerName} ({c.customerCode})</option>
                ))}
              </select>
            </div>
            <Input
              label="Order Date"
              type="date"
              defaultValue={new Date().toISOString().substring(0, 10)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Product Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                Add Item
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">Product</label>
                    <select
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                      value={item.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      required
                    >
                      <option value="">Select Product</option>
                      {productsData?.products?.map(p => (
                        <option key={p._id} value={p._id}>{p.productName} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemQtyChange(index, e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      label="Unit Price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemPriceChange(index, e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-24 text-right pr-2">
                    <p className="text-xs text-slate-500 mb-1.5">Subtotal</p>
                    <span className="text-sm text-slate-200 font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-slate-500 hover:text-red-400 shrink-0"
                    onClick={() => removeItemRow(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-sm">Estimated Total Amount</span>
            <span className="text-lg font-bold text-white">{formatCurrency(calculateTotal())}</span>
          </div>

          <Input
            label="Remarks / Notes"
            placeholder="Add delivery terms, packaging specs, or other remarks..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createOrderMutation.isLoading}>
              Save as Draft
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SalesOrdersPage
