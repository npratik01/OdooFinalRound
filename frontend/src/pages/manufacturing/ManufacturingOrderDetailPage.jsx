import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle, XCircle, Play, PackageCheck,
  Calendar, Package, ClipboardList, Clock, Cpu, User, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  fetchManufacturingOrderById,
  confirmManufacturingOrder,
  startManufacturingOrder,
  completeManufacturingOrder,
  cancelManufacturingOrder,
  fetchWorkOrdersForMO,
  startWorkOrder,
  completeWorkOrder,
  cancelWorkOrder
} from '../../api/manufacturing.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const MFG_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER]

const STATUS_COLORS = {
  'Draft':       'bg-slate-700/80 text-slate-300 border-slate-600',
  'Confirmed':   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Ready':       'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'In Progress': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Completed':   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Cancelled':   'bg-red-500/15 text-red-400 border-red-500/30',
}

const WO_STATUS_COLORS = {
  'Pending':     'bg-slate-800 text-slate-400 border-slate-700',
  'Ready':       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'In Progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Completed':   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Cancelled':   'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function ManufacturingOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole(MFG_ROLES)

  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completeQty, setCompleteQty] = useState(0)
  const [completeRemarks, setCompleteRemarks] = useState('')

  // 1. Fetch MO details
  const { data: mo, isLoading } = useQuery({
    queryKey: ['manufacturing-order', id],
    queryFn:  () => fetchManufacturingOrderById(id),
    select:   r => r.data?.data?.mo,
  })

  // 2. Fetch Work Orders for MO
  const { data: workOrdersData } = useQuery({
    queryKey: ['mo-work-orders', id],
    queryFn:  () => fetchWorkOrdersForMO(id),
    select:   r => r.data?.data?.workOrders || [],
  })

  // 3. Confirm MO Mutation
  const confirmMutation = useMutation({
    mutationFn: () => confirmManufacturingOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['mo-work-orders', id] })
      toast.success('Manufacturing Order confirmed & components reserved!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to confirm MO'),
  })

  // 4. Start MO Mutation
  const startMutation = useMutation({
    mutationFn: () => startManufacturingOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['mo-work-orders', id] })
      toast.success('Production started!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to start MO'),
  })

  // 5. Complete MO Mutation
  const completeMutation = useMutation({
    mutationFn: (data) => completeManufacturingOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['mo-work-orders', id] })
      toast.success('Manufacturing Order completed successfully!')
      setShowCompleteModal(false)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to complete MO'),
  })

  // 6. Cancel MO Mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelManufacturingOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['mo-work-orders', id] })
      toast.success('Manufacturing Order cancelled')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to cancel MO'),
  })

  // 7. Work Order Mutations
  const startWOMutation = useMutation({
    mutationFn: (woId) => startWorkOrder(woId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['mo-work-orders', id] })
      toast.success('Work Order started!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to start Work Order'),
  })

  const completeWOMutation = useMutation({
    mutationFn: ({ woId, data }) => completeWorkOrder(woId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['mo-work-orders', id] })
      toast.success('Work Order completed!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to complete Work Order'),
  })

  const cancelWOMutation = useMutation({
    mutationFn: (woId) => cancelWorkOrder(woId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] })
      queryClient.invalidateQueries({ queryKey: ['mo-work-orders', id] })
      toast.success('Work Order cancelled')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to cancel Work Order'),
  })

  if (isLoading) return <div className="p-6"><div className="h-96 bg-slate-800/50 rounded-2xl animate-pulse" /></div>
  if (!mo) return <div className="p-6 text-center text-slate-400">Manufacturing Order not found</div>

  const canConfirm = mo.status === 'Draft' && canManage
  const canStart   = ['Confirmed', 'Ready'].includes(mo.status) && canManage
  const canComplete = mo.status === 'In Progress' && canManage
  const canCancel  = ['Draft', 'Confirmed', 'Ready', 'In Progress'].includes(mo.status) && canManage

  const handleOpenCompleteModal = () => {
    setCompleteQty(mo.quantityToProduce)
    setCompleteRemarks('')
    setShowCompleteModal(true)
  }

  const handleCompleteSubmit = (e) => {
    e.preventDefault()
    completeMutation.mutate({
      quantityProduced: parseInt(completeQty, 10),
      remarks:          completeRemarks,
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back + Action buttons */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          {canCancel && (
            <button
              onClick={() => { if (window.confirm('Cancel this Manufacturing Order? This will release reservations.')) cancelMutation.mutate() }}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl text-sm transition-all"
            >
              <XCircle size={14} /> Cancel MO
            </button>
          )}
          {canConfirm && (
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-xl text-sm transition-all animate-pulse"
            >
              <CheckCircle size={14} /> Confirm & Reserve
            </button>
          )}
          {canStart && (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="flex items-center gap-2 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Play size={14} /> Start Production
            </button>
          )}
          {canComplete && (
            <button
              onClick={handleOpenCompleteModal}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <PackageCheck size={14} /> Complete Production
            </button>
          )}
        </div>
      </div>

      {/* Header Info */}
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
              <p className="text-xs text-slate-500">Product</p>
            </div>
            <p className="text-sm font-semibold text-white">{mo.productId?.productName}</p>
            <p className="text-xs text-slate-400">{mo.productId?.sku}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList size={13} className="text-slate-500" />
              <p className="text-xs text-slate-500">BoM Code</p>
            </div>
            <p className="text-sm font-semibold text-white font-mono">{mo.bomId?.bomCode}</p>
            <p className="text-xs text-slate-400">Version {mo.bomId?.version}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={13} className="text-slate-500" />
              <p className="text-xs text-slate-500">Planned Start/End</p>
            </div>
            <p className="text-sm font-semibold text-white">
              {mo.plannedStartDate ? new Date(mo.plannedStartDate).toLocaleDateString() : 'Immediate'}
            </p>
            <p className="text-xs text-slate-400">
              {mo.plannedEndDate ? `End: ${new Date(mo.plannedEndDate).toLocaleDateString()}` : 'No deadline'}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Production Qty</p>
            <p className="text-lg font-bold text-white">{mo.quantityProduced} / {mo.quantityToProduce}</p>
            <p className="text-xs text-slate-400">{mo.quantityRemaining} remaining</p>
          </div>
        </div>

        {mo.remarks && (
          <div className="mt-4 p-3 bg-slate-900/30 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Remarks</p>
            <p className="text-sm text-slate-300">{mo.remarks}</p>
          </div>
        )}
      </div>

      {/* Component Reservation Status */}
      {mo.componentRequirements && mo.componentRequirements.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-violet-400" />
              <h2 className="font-semibold text-white">Component Reservation Engine</h2>
            </div>
            {mo.status !== 'Draft' && (
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                Stock Reserved Automatically
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Component</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Required Qty</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Consumed Qty</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Reservation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {mo.componentRequirements.map((comp, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-white">{comp.productId?.productName || 'Unknown Component'}</p>
                      <p className="text-xs text-slate-500">{comp.productId?.sku}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-300 font-semibold">{comp.quantityRequired} {comp.unit}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-emerald-400 font-semibold">{comp.quantityConsumed ?? 0} {comp.unit}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mo.status === 'Draft' ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {mo.status === 'Draft' ? 'Pending Release' : 'Reserved'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Work Orders Board / List */}
      {workOrdersData && workOrdersData.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-700/50 flex items-center gap-2">
            <Cpu size={16} className="text-violet-400" />
            <h2 className="font-semibold text-white">Work Order Board (Production Sequence)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Sequence & WO</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Operation / Work Center</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Planned Dur.</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actual Dur.</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="px-5 py-3 w-[180px] text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {workOrdersData.map((wo) => (
                  <tr key={wo._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-xs text-violet-400 font-bold border border-violet-500/20">
                          {wo.sequence}
                        </span>
                        <div>
                          <p className="text-sm font-mono font-semibold text-violet-400">{wo.workOrderNumber}</p>
                          <p className="text-xs text-slate-500">Operator: {wo.assignedOperator?.name || 'Automated'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-white">{wo.operationId?.operationName}</p>
                      <p className="text-xs text-slate-400">{wo.workCenterId?.workCenterName}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-300 font-mono">{wo.plannedDurationMinutes} min</td>
                    <td className="px-5 py-3.5 text-right text-sm text-emerald-400 font-mono">
                      {wo.status === 'Completed' ? `${wo.actualDurationMinutes} min` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${WO_STATUS_COLORS[wo.status]}`}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {canManage && wo.status === 'Ready' && (
                        <button
                          onClick={() => startWOMutation.mutate(wo._id)}
                          className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Start WO
                        </button>
                      )}
                      {canManage && wo.status === 'In Progress' && (
                        <button
                          onClick={() => {
                            const actDur = window.prompt("Enter actual duration in minutes (leave blank for auto calculation):")
                            completeWOMutation.mutate({
                              woId: wo._id,
                              data: actDur ? { actualDurationMinutes: parseInt(actDur, 10) } : {}
                            })
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Complete WO
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complete MO Dialog */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCompleteSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white">Complete Manufacturing Order</h3>
            <p className="text-slate-400 text-sm">
              Confirm finished goods output quantity. This will update physical stock and consume the reserved raw materials.
            </p>
            <div>
              <label className={LabelCls}>Produced Quantity (Finished Goods)</label>
              <input
                type="number"
                min={1}
                max={mo.quantityToProduce}
                value={completeQty}
                onChange={e => setCompleteQty(e.target.value)}
                className={InputCls}
                required
              />
            </div>
            <div>
              <label className={LabelCls}>Completion Remarks</label>
              <textarea
                value={completeRemarks}
                onChange={e => setCompleteRemarks(e.target.value)}
                rows={2}
                placeholder="Optional feedback, quality remarks, etc."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 text-sm text-slate-400 bg-slate-800 border border-slate-700 rounded-xl hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={completeMutation.isPending}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                {completeMutation.isPending ? 'Completing...' : 'Complete & Produce'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
