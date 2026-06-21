import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, Play, PackageCheck, Calendar, Wrench, Package, Cpu } from 'lucide-react'
import toast from 'react-hot-toast'
import { manufacturingApi } from '../../api/manufacturing.api'
import { inventoryMovementApi } from '../../api/inventoryMovement.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'
import TraceabilityTree from '../../components/common/TraceabilityTree'

const MFG_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER]

const STATUS_COLORS = {
  'DRAFT':                  'bg-slate-700/80 text-slate-300 border-slate-600',
  'CONFIRMED':              'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'WAITING_FOR_COMPONENTS': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  'IN_PROGRESS':            'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'DONE':                   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'CANCELLED':              'bg-red-500/15 text-red-400 border-red-500/30',
  'REJECTED':               'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

export default function ManufacturingOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole(MFG_ROLES)

  const [isProduceModalOpen, setIsProduceModalOpen] = useState(false)
  const [producedQtyInput, setProducedQtyInput] = useState('')
  const [produceRemarks, setProduceRemarks] = useState('')

  const { data: mo, isLoading } = useQuery({
    queryKey: ['manufacturing-order', id],
    queryFn:  () => manufacturingApi.getManufacturingOrderById(id),
    select:   r => r.data?.data,
  })

  const { data: movements } = useQuery({
    queryKey: ['mo-movements', id],
    queryFn:  () => inventoryMovementApi.getMovements({ referenceId: id }),
    select:   r => r.data?.data?.movements || [],
  })

  const confirmMutation = useMutation({
    mutationFn: () => manufacturingApi.confirmManufacturingOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] })
      toast.success('Manufacturing Order confirmed successfully!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to confirm MO'),
  })

  const startMutation = useMutation({
    mutationFn: () => manufacturingApi.startProduction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] })
      queryClient.invalidateQueries({ queryKey: ['mo-movements', id] })
      toast.success('Production started & components reserved!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to start production'),
  })

  const produceMutation = useMutation({
    mutationFn: (payload) => manufacturingApi.produceOutput(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] })
      queryClient.invalidateQueries({ queryKey: ['mo-movements', id] })
      toast.success('Production output recorded successfully!')
      setIsProduceModalOpen(false)
      setProducedQtyInput('')
      setProduceRemarks('')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to record production output'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => manufacturingApi.cancelManufacturingOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] })
      queryClient.invalidateQueries({ queryKey: ['mo-movements', id] })
      toast.success('Manufacturing Order cancelled')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to cancel MO'),
  })

  const rejectMutation = useMutation({
    mutationFn: (reason) => manufacturingApi.rejectManufacturingOrder(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] })
      toast.success('Manufacturing Order rejected successfully')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to reject MO'),
  })

  if (isLoading) return <div className="p-6"><div className="h-96 bg-slate-800/50 rounded-2xl animate-pulse" /></div>
  if (!mo) return <div className="p-6 text-center text-slate-400">Manufacturing Order not found</div>

  const canConfirm = mo.status === 'DRAFT' && canManage
  const canReject  = mo.status === 'DRAFT' && canManage
  const canStart   = ['CONFIRMED', 'WAITING_FOR_COMPONENTS'].includes(mo.status) && canManage
  const canProduce = mo.status === 'IN_PROGRESS' && canManage
  const canCancel  = ['DRAFT', 'CONFIRMED', 'WAITING_FOR_COMPONENTS', 'IN_PROGRESS'].includes(mo.status) && canManage

  const remainingToProduce = mo.plannedQty - mo.producedQty

  const handleProduceSubmit = (e) => {
    e.preventDefault()
    const qty = parseInt(producedQtyInput, 10)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }
    if (qty > remainingToProduce) {
      toast.error(`Cannot produce more than remaining quantity (${remainingToProduce} units)`)
      return
    }
    produceMutation.mutate({ producedQty: qty, remarks: produceRemarks })
  }

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
              onClick={() => { if (window.confirm('Cancel this MO? All reserved stock will be released.')) cancelMutation.mutate() }}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl text-sm transition-all"
            >
              <XCircle size={14} /> Cancel MO
            </button>
          )}
          {canConfirm && (
            <>
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-sm transition-all"
              >
                <CheckCircle size={14} /> Confirm MO
              </button>
              {canReject && (
                <button
                  onClick={() => {
                    const reason = window.prompt('Enter rejection reason (optional):', 'Replaced by vendor/procurement changes')
                    if (reason !== null) {
                      rejectMutation.mutate(reason)
                    }
                  }}
                  disabled={rejectMutation.isPending}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-xl text-sm transition-all"
                >
                  <XCircle size={14} /> Reject MO
                </button>
              )}
            </>
          )}
          {canStart && (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Play size={14} /> Start Production
            </button>
          )}
          {canProduce && (
            <button
              onClick={() => {
                setProducedQtyInput(String(remainingToProduce))
                setIsProduceModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <PackageCheck size={14} /> Record Output
            </button>
          )}
        </div>
      </div>

      {/* MO Header Card */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white font-mono">{mo.moNumber}</h1>
            <p className="text-slate-400 text-sm mt-1">Created by {mo.createdBy?.name} · {new Date(mo.createdAt).toLocaleString()}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${STATUS_COLORS[mo.status]}`}>
            {mo.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package size={13} className="text-slate-500" />
              <p className="text-xs text-slate-500">Output Product</p>
            </div>
            <p className="text-sm font-semibold text-white">{mo.productId?.productName}</p>
            <p className="text-xs text-slate-400 font-mono">{mo.productId?.sku}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wrench size={13} className="text-slate-500" />
              <p className="text-xs text-slate-500">Work Center</p>
            </div>
            {mo.workCenterId ? (
              <>
                <p className="text-sm font-semibold text-white">{mo.workCenterId.name}</p>
                <p className="text-xs text-slate-400">{mo.workCenterId.code}</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-500">None assigned</p>
            )}
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={13} className="text-slate-500" />
              <p className="text-xs text-slate-500">Scheduled Date</p>
            </div>
            <p className="text-sm font-semibold text-white">
              {mo.scheduledDate ? new Date(mo.scheduledDate).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Production Qty</p>
            <p className="text-lg font-bold text-white">
              {mo.producedQty} <span className="text-slate-500 text-sm font-normal">/ {mo.plannedQty} planned</span>
            </p>
            {mo.plannedQty > 0 && (
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${mo.completionPercentage}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {mo.bomId && (
          <div className="mt-4 p-3 bg-slate-900/30 rounded-xl flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-1.5"><Cpu size={14} /> Bill of Materials:</span>
            <span className="text-primary-400 font-mono font-medium">{mo.bomId.bomCode} (v{mo.bomId.version})</span>
          </div>
        )}

        {mo.createdAutomatically && (
          <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between text-sm">
            <span className="text-purple-400 font-semibold flex items-center gap-1.5">
              🤖 Auto-Procured MO (Deficit replenishment)
            </span>
            {mo.sourceSalesOrderNumber && (
              <span className="text-slate-300">
                Source SO:{' '}
                {mo.linkedSoId ? (
                  <Link to={`/sales/${mo.linkedSoId}`} className="text-primary-400 hover:underline font-mono font-semibold">
                    {mo.sourceSalesOrderNumber}
                  </Link>
                ) : (
                  <span className="font-mono">{mo.sourceSalesOrderNumber}</span>
                )}
                {mo.pendingDemandQty != null && (
                  <span className="text-slate-500 ml-1">
                    (Demand: {mo.pendingDemandQty})
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {mo.status === 'REJECTED' && mo.rejectionReason && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm">
            <p className="text-rose-400 font-bold">MO Rejected by Manager</p>
            <p className="text-slate-300 mt-1">{mo.rejectionReason}</p>
          </div>
        )}

        {mo.remarks && (
          <div className="mt-4 p-3 bg-slate-900/30 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Remarks</p>
            <p className="text-sm text-slate-300">{mo.remarks}</p>
          </div>
        )}
      </div>

      {/* Component Requirements */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-700/50">
          <h2 className="font-semibold text-white">Component Requirements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/30">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Component</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Required Qty</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Reserved Qty</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Consumed Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {mo.components?.map((comp, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{comp.productId?.productName}</p>
                    <p className="text-xs text-slate-500 font-mono">{comp.productId?.sku}</p>
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-slate-300">{comp.requiredQty}</td>
                  <td className="px-5 py-4 text-right text-sm">
                    <span className={comp.reservedQty > 0 ? 'text-blue-400 font-medium' : 'text-slate-500'}>
                      {comp.reservedQty}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-sm">
                    <span className={comp.consumedQty > 0 ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                      {comp.consumedQty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production History & Movements */}
      {movements && movements.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-700/50">
            <h2 className="font-semibold text-white">Stock Movements History</h2>
          </div>
          <div className="divide-y divide-slate-700/30">
            {movements.map(m => (
              <div key={m._id} className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-slate-800/30 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{m.productId?.productName}</span>
                    <span className="text-xs font-mono text-slate-500">{m.productId?.sku}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{m.remarks || 'No description'}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      m.movementType === 'MFG_OUTPUT_PRODUCE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {m.movementType === 'MFG_OUTPUT_PRODUCE' ? `+${m.quantity} Produced` : `-${m.quantity} Reserved/Consumed`}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-1">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Traceability Flow Tree (Orchestration Brain) */}
      {mo.status !== 'DRAFT' && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <TraceabilityTree docId={mo._id} />
        </div>
      )}

      {/* Record Output Modal */}
      {isProduceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Record Production Output</h3>
              <button onClick={() => setIsProduceModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleProduceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Quantity Produced
                </label>
                <input
                  type="number"
                  min="1"
                  max={remainingToProduce}
                  required
                  value={producedQtyInput}
                  onChange={e => setProducedQtyInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
                <p className="text-xs text-slate-500 mt-1">Remaining to produce: {remainingToProduce} units</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Remarks / Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Batch #4 compiled successfully"
                  value={produceRemarks}
                  onChange={e => setProduceRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsProduceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={produceMutation.isPending}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {produceMutation.isPending ? 'Saving...' : 'Record Output'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
