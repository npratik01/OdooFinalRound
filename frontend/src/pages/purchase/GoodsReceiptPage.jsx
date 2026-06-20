import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, PackageCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { purchaseApi } from '../../api/purchase.api'

export default function GoodsReceiptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn:  () => purchaseApi.getPurchaseOrderById(id),
    select:   r => r.data?.data,
  })

  // Build initial qty map from PO items
  const [qtyMap, setQtyMap] = useState({})
  const [receiptRemarks, setReceiptRemarks] = useState('')

  // Initialize qtyMap when po loads
  if (po && Object.keys(qtyMap).length === 0) {
    const initial = {}
    po.items.forEach(item => {
      const pending = item.quantity - item.receivedQty
      initial[item.productId?._id || item.productId] = { receive: pending > 0 ? pending : 0, pending }
    })
    setQtyMap(initial)
  }

  const mutation = useMutation({
    mutationFn: data => purchaseApi.receiveGoods(id, data),
    onSuccess: r => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['po-receipts', id] })
      const gr = r.data?.data?.goodsReceipt
      const newStatus = r.data?.data?.purchaseOrder?.status
      toast.success(`${gr?.grNumber} created. PO is now: ${newStatus}`)
      navigate(`/purchase-orders/${id}`)
    },
    onError: err => toast.error(err.response?.data?.message || 'Receipt failed'),
  })

  const handleReceive = () => {
    const items = []
    for (const [productId, v] of Object.entries(qtyMap)) {
      if (v.receive > 0) {
        items.push({ productId, quantityReceived: parseInt(v.receive, 10) })
      }
    }
    if (items.length === 0) {
      toast.error('No items to receive. Enter quantities > 0.')
      return
    }
    mutation.mutate({ items, remarks: receiptRemarks })
  }

  if (isLoading) return <div className="p-6"><div className="h-64 bg-slate-800/50 rounded-2xl animate-pulse" /></div>
  if (!po) return <div className="p-6 text-center text-slate-400">PO not found</div>

  const pendingItems = po.items.filter(item => (item.quantity - item.receivedQty) > 0)

  if (!['Confirmed', 'Partially Received'].includes(po.status)) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center">
          <AlertTriangle size={40} className="mx-auto mb-3 text-amber-400" />
          <p className="text-amber-300 font-semibold">Cannot receive goods</p>
          <p className="text-slate-400 text-sm mt-1">PO status is <strong>{po.status}</strong>. Only Confirmed or Partially Received POs can be receipted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Receive Goods</h1>
          <p className="text-slate-400 text-sm">{po.poNumber} · {po.vendorId?.vendorName}</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <PackageCheck size={16} className="text-blue-400" />
        <p className="text-sm text-blue-300">
          PO Status: <strong>{po.status}</strong> · Enter quantities received for each item
        </p>
      </div>

      {/* Receipt Items */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-700/50">
          <h2 className="font-semibold text-white">Items to Receive</h2>
        </div>
        <div className="divide-y divide-slate-700/30">
          {pendingItems.map(item => {
            const pid = item.productId?._id || item.productId
            const pending = item.quantity - item.receivedQty
            const receiveQty = qtyMap[pid]?.receive ?? 0
            const isFullyFilling = receiveQty >= pending

            return (
              <div key={pid} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.productId?.productName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.productId?.sku}</p>
                  <div className="flex gap-3 mt-1.5 text-xs">
                    <span className="text-slate-500">Ordered: <span className="text-slate-300">{item.quantity}</span></span>
                    <span className="text-slate-500">Already Received: <span className="text-emerald-400">{item.receivedQty}</span></span>
                    <span className="text-slate-500">Pending: <span className="text-amber-400 font-semibold">{pending}</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Receive Qty</label>
                  <input
                    type="number"
                    min={0}
                    max={pending}
                    value={receiveQty}
                    onChange={e => setQtyMap(prev => ({
                      ...prev,
                      [pid]: { ...prev[pid], receive: Math.min(pending, Math.max(0, parseInt(e.target.value) || 0)) }
                    }))}
                    className="w-24 px-3 py-2 bg-slate-900 border border-slate-600 rounded-xl text-sm text-center text-white focus:outline-none focus:border-primary-500"
                  />
                  {isFullyFilling && <CheckCircle2 size={16} className="text-emerald-400" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Remarks */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
        <label className="block text-xs font-medium text-slate-400 mb-2">Receipt Remarks (optional)</label>
        <textarea
          value={receiptRemarks}
          onChange={e => setReceiptRemarks(e.target.value)}
          rows={2}
          placeholder="e.g., Received in good condition"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm text-slate-400 bg-slate-800 border border-slate-700 rounded-xl hover:text-white transition-colors">
          Cancel
        </button>
        <button
          onClick={handleReceive}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60"
        >
          <PackageCheck size={16} />
          {mutation.isPending ? 'Processing...' : 'Confirm Receipt'}
        </button>
      </div>
    </div>
  )
}
