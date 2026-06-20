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
  Calendar, User, FileText, ClipboardList, AlertTriangle
} from 'lucide-react'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StockStatusBadge from '../../components/sales/StockStatusBadge'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'
import toast from 'react-hot-toast'
import TraceabilityTree from '../../components/common/TraceabilityTree'

const statusColorMap = {
  Draft: 'slate',
  Confirmed: 'indigo',
  'Partially Delivered': 'amber',
  'Fully Delivered': 'emerald',
  Cancelled: 'red',
}

const SalesOrderDetailPage = () => {
  const { id } = useParams()
  const { hasRole } = useAuth()
  const canWrite = hasRole([ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER])

  // Queries
  const { data: order, isLoading: isLoadingOrder } = useSalesOrder(id)
  const { data: deliveriesData, isLoading: isLoadingDeliveries } = useDeliveries({ soId: id })
  const { data: inventoryData, isLoading: isLoadingInventory } = useInventory()

  // Mutations
  const confirmOrderMutation = useConfirmSalesOrder()
  const cancelOrderMutation = useCancelSalesOrder()
  const processDeliveryMutation = useProcessDelivery()

  // Delivery Modal
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
  const [shipmentItems, setShipmentItems] = useState([])

  // Confirmation dialogs
  const [confirmDialogType, setConfirmDialogType] = useState(null) // 'confirm-order' | 'cancel-order'

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

  // Calculate delivered quantities per product
  const deliveredMap = {}
  deliveriesData?.data?.forEach((del) => {
    del.items?.forEach((item) => {
      const pid = item.productId._id || item.productId
      deliveredMap[pid] = (deliveredMap[pid] || 0) + item.quantityShipped
    })
  })

  const getProductFreeQty = (productId) => {
    const inv = inventoryData?.inventory?.find((i) => i.productId?._id === productId)
    return inv ? inv.freeToUseQty : 0
  }

  const openDeliveryModal = () => {
    const itemsToShip = order.items
      .map((item) => {
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
          quantityShipped: remaining,
        }
      })
      .filter((i) => i.remainingQty > 0)

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
    updated[index].quantityShipped = Math.min(qty, updated[index].remainingQty)
    setShipmentItems(updated)
  }

  const handleProcessDeliverySubmit = (e) => {
    e.preventDefault()
    const toShip = shipmentItems
      .filter((i) => i.quantityShipped > 0)
      .map((i) => ({ productId: i.productId, quantityShipped: i.quantityShipped }))

    if (toShip.length === 0) {
      toast.error('Please enter a shipping quantity > 0 for at least one item.')
      return
    }

    processDeliveryMutation.mutate(
      { soId: order._id, items: toShip },
      { onSuccess: () => setIsDeliveryModalOpen(false) }
    )
  }

  const handleConfirmOrder = () => {
    confirmOrderMutation.mutate(order._id, {
      onSuccess: () => setConfirmDialogType(null),
    })
  }

  const handleCancelOrder = () => {
    cancelOrderMutation.mutate(order._id, {
      onSuccess: () => setConfirmDialogType(null),
    })
  }

  const statusColor = statusColorMap[order.status] || 'slate'

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/sales">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 flex items-center justify-center rounded-xl"
            >
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-primary-400 font-bold">{order.soNumber}</span>
              <Badge color={statusColor} size="sm">{order.status}</Badge>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Sales Order Details</h1>
          </div>
        </div>

        {/* Action Panel */}
        {canWrite && (
          <div className="flex flex-wrap gap-3">
            {order.status === 'Draft' && (
              <>
                <Button
                  id="cancel-order-btn"
                  variant="outline"
                  className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                  onClick={() => setConfirmDialogType('cancel-order')}
                  loading={cancelOrderMutation.isLoading}
                >
                  <XCircle size={16} className="mr-2 shrink-0" /> Cancel
                </Button>
                <Button
                  id="confirm-order-btn"
                  onClick={() => setConfirmDialogType('confirm-order')}
                  loading={confirmOrderMutation.isLoading}
                >
                  <CheckCircle size={16} className="mr-2 shrink-0" /> Confirm Order
                </Button>
              </>
            )}

            {['Confirmed', 'Partially Delivered'].includes(order.status) && (
              <>
                <Button
                  id="cancel-confirmed-btn"
                  variant="outline"
                  className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                  onClick={() => setConfirmDialogType('cancel-order')}
                  loading={cancelOrderMutation.isLoading}
                >
                  <XCircle size={16} className="mr-2 shrink-0" /> Cancel Order
                </Button>
                <Button
                  id="process-delivery-btn"
                  onClick={openDeliveryModal}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Truck size={16} /> Process Delivery
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Info Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — items & deliveries */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-white">Order Items & Stock Availability</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Product</th>
                    <th className="pb-3 px-4 text-center">Ordered</th>
                    <th className="pb-3 px-4 text-center">Delivered</th>
                    <th className="pb-3 px-4 text-right">Unit Price</th>
                    <th className="pb-3 px-4 text-right">Subtotal</th>
                    <th className="pb-3 pl-4 text-right">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {order.items?.map((item) => {
                    const pid = item.productId._id || item.productId
                    const shipped = deliveredMap[pid] || 0
                    const remaining = item.quantity - shipped
                    const freeStock = getProductFreeQty(pid)

                    return (
                      <tr key={item._id}>
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-slate-200">{item.productId.productName}</p>
                          <span className="text-xs font-mono text-slate-500">{item.productId.sku}</span>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-300 font-medium">{item.quantity}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={shipped > 0 ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                            {shipped}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-slate-300">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-4 px-4 text-right text-slate-200 font-semibold">
                          {formatCurrency(item.totalPrice)}
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <StockStatusBadge
                            freeQty={freeStock}
                            requestedQty={remaining}
                            size="sm"
                            showQty={true}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deliveries Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-white">Dispatch History</h2>
            {!deliveriesData?.data || deliveriesData.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-950/55 rounded-xl border border-dashed border-slate-800">
                <Truck size={24} className="text-slate-600 mb-2" />
                <p className="text-xs text-slate-500">No shipments dispatched yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveriesData.data.map((del) => (
                  <div key={del._id} className="bg-slate-950/50 p-4 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-sm font-bold text-primary-400">{del.deliveryNumber}</span>
                        <p className="text-xs text-slate-500">Dispatched: {formatDateTime(del.deliveryDate)}</p>
                      </div>
                      <Badge color="emerald" size="sm">Dispatched</Badge>
                    </div>
                    <div className="border-t border-slate-800 pt-2.5">
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
                    <p className="text-xs text-slate-500 pt-2 border-t border-slate-800">
                      Shipped by: {del.shippedBy?.name || 'System'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — contract summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-white border-b border-slate-800 pb-3">Contract Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Total Value</span>
                <span className="text-xl font-bold text-white">{formatCurrency(order.totalAmount)}</span>
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
                    <p className="text-slate-200 font-medium">{order.customerId?.customerName || 'N/A'}</p>
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

      {/* Traceability Flow Tree (Orchestration Brain) */}
      {order.status !== 'Draft' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <TraceabilityTree docId={order._id} />
        </div>
      )}

      {/* Process Delivery Modal */}
      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        title="Process Delivery Dispatch"
        size="md"
      >
        <form onSubmit={handleProcessDeliverySubmit} className="space-y-6">
          <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl flex items-start gap-2.5">
            <Info size={16} className="text-primary-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">
              Dispatch quantities will reduce on-hand inventory and release matched reserved stock.
              Quantities cannot exceed remaining unfulfilled balance.
            </p>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {shipmentItems.map((item, index) => (
              <div
                key={item.productId}
                className="flex gap-3 items-end justify-between border-b border-slate-800 pb-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{item.productName}</p>
                  <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                    <span>Ordered: {item.orderedQty}</span>
                    <span>·</span>
                    <span>Already Shipped: {item.shippedQty}</span>
                    <span>·</span>
                    <span className="text-amber-400 font-medium">Remaining: {item.remainingQty}</span>
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
            <Button
              type="submit"
              loading={processDeliveryMutation.isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Truck size={16} className="mr-2" /> Dispatch Delivery
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Order Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogType === 'confirm-order'}
        onClose={() => setConfirmDialogType(null)}
        onConfirm={handleConfirmOrder}
        title="Confirm Sales Order"
        message={`Confirming this order will reserve stock for all ${order.items?.length} line item(s). The order status will change to Confirmed.`}
        confirmLabel="Confirm Order"
        cancelLabel="Not Now"
        variant="primary"
        isLoading={confirmOrderMutation.isLoading}
      />

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogType === 'cancel-order'}
        onClose={() => setConfirmDialogType(null)}
        onConfirm={handleCancelOrder}
        title="Cancel Sales Order"
        message={`Are you sure you want to cancel order ${order.soNumber}? Any reserved stock will be released back to inventory.`}
        confirmLabel="Yes, Cancel Order"
        cancelLabel="Keep Order"
        variant="danger"
        isLoading={cancelOrderMutation.isLoading}
      />
    </div>
  )
}

export default SalesOrderDetailPage
