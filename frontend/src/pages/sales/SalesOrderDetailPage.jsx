import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  useSalesOrder,
  useConfirmSalesOrder,
  useCancelSalesOrder,
  useDeliveries,
  useProcessDelivery
} from '../../hooks/useSales'
import { useInventory } from '../../hooks/useInventory'
import {
  ArrowLeft, ShieldAlert, CheckCircle, XCircle, Truck, Info,
  PackageCheck, Calendar, User, FileText, ClipboardList
} from 'lucide-react'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

const SalesOrderDetailPage = () => {
  const { id } = useParams()
  
  // Queries
  const { data: order, isLoading: isLoadingOrder } = useSalesOrder(id)
  const { data: deliveriesData, isLoading: isLoadingDeliveries } = useDeliveries({ soId: id })
  const { data: inventoryData, isLoading: isLoadingInventory } = useInventory()

  // Mutations
  const confirmOrderMutation = useConfirmSalesOrder()
  const cancelOrderMutation = useCancelSalesOrder()
  const processDeliveryMutation = useProcessDelivery()

  // Delivery Modal state
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
  const [shipmentItems, setShipmentItems] = useState([])

  if (isLoadingOrder || isLoadingDeliveries || isLoadingInventory) return <LoadingSpinner />

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Sales Order Not Found</h2>
        <p className="text-slate-400 mb-6">The order you are trying to view does not exist.</p>
        <Link to="/sales">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Sales
          </Button>
        </Link>
      </div>
    )
  }

  // Calculate remaining quantities to ship
  const deliveredMap = {}
  deliveriesData?.deliveries?.forEach(del => {
    del.items?.forEach(item => {
      const pid = item.productId._id || item.productId
      deliveredMap[pid] = (deliveredMap[pid] || 0) + item.quantityShipped
    })
  })

  // Stock availability check map
  const getProductFreeQty = (productId) => {
    const inv = inventoryData?.inventory?.find(i => i.productId?._id === productId)
    return inv ? inv.freeToUseQty : 0
  }

  const openDeliveryModal = () => {
    // Populate items that have remaining quantities to ship
    const itemsToShip = order.items
      .map(item => {
        const pid = item.productId._id || item.productId
        const shipped = deliveredMap[pid] || 0
        const remaining = item.quantity - shipped
        return {
          productId: pid,
          productName: item.productId.productName,
          sku: item.productId.sku,
          orderedQty: item.quantity,
          shippedQty: shipped,
          remainingQty: remaining,
          quantityShipped: remaining // Default to ship remaining
        }
      })
      .filter(item => item.remainingQty > 0)

    if (itemsToShip.length === 0) {
      toast.error('All items have already been fully delivered.')
      return
    }

    setShipmentItems(itemsToShip)
    setIsDeliveryModalOpen(true)
  }

  const handleShipQtyChange = (index, val) => {
    const qty = parseInt(val, 10) || 0
    const updated = [...shipmentItems]
    const max = updated[index].remainingQty
    updated[index].quantityShipped = Math.min(qty, max)
    setShipmentItems(updated)
  }

  const handleProcessDeliverySubmit = (e) => {
    e.preventDefault()
    
    // Check if at least one item has > 0 qty to ship
    const toShip = shipmentItems
      .filter(item => item.quantityShipped > 0)
      .map(item => ({
        productId: item.productId,
        quantityShipped: item.quantityShipped
      }))

    if (toShip.length === 0) {
      toast.error('Please specify a shipping quantity greater than 0 for at least one item.')
      return
    }

    // Verify stock availability
    for (const item of toShip) {
      const free = getProductFreeQty(item.productId)
      if (item.quantityShipped > free) {
        toast.error(`Cannot ship ${item.quantityShipped} units. Only ${free} units are currently available/free in inventory.`)
        return
      }
    }

    processDeliveryMutation.mutate({
      soId: order._id,
      items: toShip
    }, {
      onSuccess: () => {
        setIsDeliveryModalOpen(false)
      }
    })
  }

  // Determine status color
  let statusColor = 'slate'
  if (order.status === 'Draft') statusColor = 'slate'
  if (order.status === 'Confirmed') statusColor = 'indigo'
  if (order.status === 'Partially Delivered') statusColor = 'amber'
  if (order.status === 'Fully Delivered') statusColor = 'emerald'
  if (order.status === 'Cancelled') statusColor = 'red'

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/sales">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 flex items-center justify-center rounded-xl">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-primary-400 font-semibold">{order.soNumber}</span>
              <Badge color={statusColor} size="sm">{order.status}</Badge>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Sales Order Details</h1>
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap gap-3">
          {order.status === 'Draft' && (
            <>
              <Button
                variant="outline"
                className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                onClick={() => cancelOrderMutation.mutate(order._id)}
                loading={cancelOrderMutation.isLoading}
              >
                <XCircle size={16} className="mr-2 shrink-0" /> Cancel
              </Button>
              <Button
                onClick={() => confirmOrderMutation.mutate(order._id)}
                loading={confirmOrderMutation.isLoading}
              >
                <CheckCircle size={16} className="mr-2 shrink-0" /> Confirm Order
              </Button>
            </>
          )}

          {['Confirmed', 'Partially Delivered'].includes(order.status) && (
            <>
              <Button
                variant="outline"
                className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                onClick={() => cancelOrderMutation.mutate(order._id)}
                loading={cancelOrderMutation.isLoading}
              >
                <XCircle size={16} className="mr-2 shrink-0" /> Cancel Order
              </Button>
              <Button
                onClick={openDeliveryModal}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Truck size={16} /> Process Delivery
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Info Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-white">Order Items & Availability</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Product Info</th>
                    <th className="pb-3 px-4 text-center">Ordered</th>
                    <th className="pb-3 px-4 text-center">Delivered</th>
                    <th className="pb-3 px-4 text-right">Price</th>
                    <th className="pb-3 px-4 text-right">Subtotal</th>
                    <th className="pb-3 pl-4 text-right">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {order.items?.map((item) => {
                    const pid = item.productId._id || item.productId
                    const shipped = deliveredMap[pid] || 0
                    const freeStock = getProductFreeQty(pid)
                    const isAvailable = freeStock >= (item.quantity - shipped)
                    
                    return (
                      <tr key={item._id}>
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-slate-200">{item.productId.productName}</p>
                          <span className="text-xs font-mono text-slate-500">{item.productId.sku}</span>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-300 font-medium">
                          {item.quantity}
                        </td>
                        <td className="py-4 px-4 text-center text-slate-400">
                          {shipped}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-300">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-200 font-semibold">
                          {formatCurrency(item.totalPrice)}
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isAvailable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {isAvailable ? 'Stock OK' : 'Shortage'} ({freeStock} Free)
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deliveries Dispatch Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-white">Processed Deliveries / Dispatches</h2>
            
            {!deliveriesData?.deliveries || deliveriesData.deliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-950/55 rounded-xl border border-dashed border-slate-800">
                <Truck size={24} className="text-slate-600 mb-2" />
                <p className="text-xs text-slate-500">No shipments dispatches have been registered for this contract.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveriesData.deliveries.map(del => (
                  <div key={del._id} className="bg-slate-950/50 p-4 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-sm font-semibold text-primary-400">{del.deliveryNumber}</span>
                        <p className="text-xs text-slate-500">Shipped on: {formatDateTime(del.deliveryDate)}</p>
                      </div>
                      <Badge color="emerald" size="sm">Dispatched</Badge>
                    </div>

                    <div className="border-t border-slate-850 pt-2.5">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1.5">Shipped Items</p>
                      <ul className="text-sm space-y-1">
                        {del.items?.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-slate-300">
                            <span>{item.productId?.productName || 'Unknown Product'}</span>
                            <span className="font-semibold text-slate-200">{item.quantityShipped} units</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-850 flex justify-between">
                      <span>Shipped By: {del.shippedBy?.name || 'System'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Right */}
        <div className="space-y-6">
          {/* Summary Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-white border-b border-slate-800 pb-3">Contract Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-xs text-slate-400">Total Value</span>
                <span className="text-lg font-bold text-white">{formatCurrency(order.totalAmount)}</span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex gap-2.5 items-start">
                  <Calendar size={15} className="text-slate-500 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500">Order Date</span>
                    <p className="text-slate-200">{formatDateTime(order.orderDate)}</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <User size={15} className="text-slate-500 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500">Customer</span>
                    <p className="text-slate-200">{order.customerId?.customerName || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{order.customerId?.email || ''}</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <ClipboardList size={15} className="text-slate-500 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500">Created By</span>
                    <p className="text-slate-200">{order.createdBy?.name || 'System'}</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start pt-3 border-t border-slate-800">
                  <FileText size={15} className="text-slate-500 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500">Remarks</span>
                    <p className="text-slate-300 text-xs italic">{order.remarks || 'No remarks provided.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Delivery Modal */}
      <Modal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} title="Process Delivery Dispatch" size="md">
        <form onSubmit={handleProcessDeliverySubmit} className="space-y-6">
          <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl flex items-start gap-2.5">
            <Info size={16} className="text-primary-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">
              Entering dispatch quantities will subtract on-hand quantity and release matching reserved stock. Quantities cannot exceed the remaining balance.
            </p>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {shipmentItems.map((item, index) => (
              <div key={item.productId} className="flex gap-3 items-end justify-between border-b border-slate-800 pb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{item.productName}</p>
                  <div className="flex gap-2 text-xs text-slate-500">
                    <span>Ordered: {item.orderedQty}</span>
                    <span>•</span>
                    <span>Remaining: {item.remainingQty}</span>
                  </div>
                </div>
                <div className="w-28 shrink-0">
                  <Input
                    label="Qty to Ship"
                    type="number"
                    min="0"
                    max={item.remainingQty}
                    value={item.quantityShipped}
                    onChange={(e) => handleShipQtyChange(index, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsDeliveryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={processDeliveryMutation.isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Truck size={16} className="mr-2" /> Dispatch Delivery
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SalesOrderDetailPage
