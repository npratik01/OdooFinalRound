import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, PackageCheck, Calendar, Building2, Package, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import { purchaseApi } from '../../api/purchase.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const PURCHASE_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER]

const STATUS_COLORS = {
  'Draft':              'bg-slate-700/80 text-slate-300 border-slate-600',
  'Confirmed':          'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Partially Received': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Fully Received':     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Cancelled':          'bg-red-500/15 text-red-400 border-red-500/30',
}

export default function PurchaseOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole(PURCHASE_ROLES)

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn:  () => purchaseApi.getPurchaseOrderById(id),
    select:   r => r.data?.data,
  })

  const { data: receipts } = useQuery({
    queryKey: ['po-receipts', id],
    queryFn:  () => purchaseApi.getReceiptsByPO(id),
    select:   r => r.data?.data,
  })

  const confirmMutation = useMutation({
    mutationFn: () => purchaseApi.confirmPurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Purchase Order confirmed!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to confirm PO'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => purchaseApi.cancelPurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Purchase Order cancelled')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to cancel PO'),
  })

  if (isLoading) return <div className="p-6"><div className="h-96 bg-slate-800/50 rounded-2xl animate-pulse" /></div>
  if (!po) return <div className="p-6 text-center text-slate-400">Purchase Order not found</div>

  const canConfirm = po.status === 'Draft' && canManage
  const canCancel  = ['Draft', 'Confirmed'].includes(po.status) && canManage
  const canReceive = ['Confirmed', 'Partially Received'].includes(po.status) && canManage

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          {canCancel && (
            <button
              onClick={() => { if (window.confirm('Cancel this PO?')) cancelMutation.mutate() }}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl text-sm transition-all"
            >
              <XCircle size={14} /> Cancel PO
            </button>
          )}
          {canConfirm && (
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-sm transition-all"
            >
              <CheckCircle size={14} /> Confirm PO
            </button>
          )}
          {canReceive && (
            <Link
              to={`/purchase-orders/${id}/receive`}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <PackageCheck size={14} /> Receive Goods
            </Link>
          )}
        </div>
      </div>

      {/* PO Header */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white font-mono">{po.poNumber}</h1>
            <p className="text-slate-400 text-sm mt-1">Created by {po.createdBy?.name} · {new Date(po.createdAt).toLocaleString()}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${STATUS_COLORS[po.status]}`}>
            {po.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={13} className="text-slate-500" />
              <p className="text-xs text-slate-500">Vendor</p>
            </div>
            <p className="text-sm font-semibold text-white">{po.vendorId?.vendorName}</p>
            <p className="text-xs text-slate-400">{po.vendorId?.vendorCode}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={13} className="text-slate-500" />
              <p className="text-xs text-slate-500">Order Date</p>
            </div>
            <p className="text-sm font-semibold text-white">{new Date(po.orderDate).toLocaleDateString()}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Truck size={13} className="text-slate-500" />
              <p className="text-xs text-slate-500">Expected Delivery</p>
            </div>
            <p className="text-sm font-semibold text-white">
              {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Total Amount</p>
            <p className="text-lg font-bold text-white">₹{po.totalAmount?.toLocaleString()}</p>
          </div>
        </div>

        {po.remarks && (
          <div className="mt-4 p-3 bg-slate-900/30 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Remarks</p>
            <p className="text-sm text-slate-300">{po.remarks}</p>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-700/50">
          <h2 className="font-semibold text-white">Order Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/30">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Product</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Ordered</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Received</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Pending</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Unit Cost</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {po.items?.map((item, i) => {
                const pending = item.quantity - item.receivedQty
                return (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{item.productId?.productName}</p>
                      <p className="text-xs text-slate-500">{item.productId?.sku}</p>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-slate-300">{item.quantity}</td>
                    <td className="px-5 py-4 text-right text-sm text-emerald-400 font-medium">{item.receivedQty}</td>
                    <td className="px-5 py-4 text-right text-sm">
                      <span className={pending > 0 ? 'text-amber-400 font-medium' : 'text-slate-500'}>{pending}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-slate-300">₹{item.unitCost?.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-white">₹{item.totalCost?.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700/50 bg-slate-900/30">
                <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-slate-300 text-right">Total Amount</td>
                <td className="px-5 py-3 text-right text-sm font-bold text-white">₹{po.totalAmount?.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Receipt History */}
      {receipts && receipts.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-700/50">
            <h2 className="font-semibold text-white">Receipt History</h2>
          </div>
          <div className="divide-y divide-slate-700/30">
            {receipts.map(gr => (
              <div key={gr._id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono font-semibold text-emerald-400">{gr.grNumber}</span>
                  <span className="text-xs text-slate-400">{new Date(gr.receiptDate).toLocaleString()}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {gr.items?.map((item, i) => (
                    <span key={i} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs border border-emerald-500/20">
                      {item.productId?.productName} × {item.quantityReceived}
                    </span>
                  ))}
                </div>
                {gr.remarks && <p className="text-xs text-slate-500 mt-1">{gr.remarks}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
