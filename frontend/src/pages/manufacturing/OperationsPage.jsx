import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Cpu } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchOperations, createOperation, updateOperation, fetchWorkCenters } from '../../api/manufacturing.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const InputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
const LabelCls = "block text-xs font-medium text-slate-400 mb-1.5"

export default function OperationsPage() {
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole([ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER])

  const [showModal, setShowModal] = useState(false)
  const [editingOp, setEditingOp] = useState(null)
  const [formData, setFormData] = useState({
    operationName: '',
    description: '',
    standardDurationMinutes: 60,
    workCenterId: '',
    sequence: 1,
  })

  // Queries & Mutations
  const { data: opsData, isLoading } = useQuery({
    queryKey: ['operations-list'],
    queryFn:  () => fetchOperations({ limit: 100 }),
    select:   r => r.data?.data,
  })

  const ops = opsData?.operations || []

  const { data: wcsData } = useQuery({
    queryKey: ['work-centers-active'],
    queryFn:  () => fetchWorkCenters({ isActive: 'true', limit: 100 }),
    select:   r => r.data?.data?.workCenters || [],
  })

  const createMutation = useMutation({
    mutationFn: (data) => createOperation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-list'] })
      toast.success('Operation created successfully!')
      setShowModal(false)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create Operation'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateOperation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-list'] })
      toast.success('Operation updated successfully!')
      setShowModal(false)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to update Operation'),
  })

  const handleOpenCreate = () => {
    setEditingOp(null)
    setFormData({
      operationName: '',
      description: '',
      standardDurationMinutes: 60,
      workCenterId: '',
      sequence: 1,
    })
    setShowModal(true)
  }

  const handleOpenEdit = (op) => {
    setEditingOp(op)
    setFormData({
      operationName:          op.operationName,
      description:            op.description || '',
      standardDurationMinutes:op.standardDurationMinutes || 60,
      workCenterId:           op.workCenterId?._id || '',
      sequence:               op.sequence || 1,
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      standardDurationMinutes: parseInt(formData.standardDurationMinutes, 10),
      sequence:                parseInt(formData.sequence, 10),
    }
    if (editingOp) {
      updateMutation.mutate({ id: editingOp._id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu size={22} className="text-violet-400" />
            Operations Catalog
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configure individual production operations and execution routings</p>
        </div>
        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={16} /> New Operation
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Code', 'Operation Name', 'Work Center', 'Standard Duration', 'Sequence', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-slate-700/40 rounded animate-pulse" /></td></tr>
                ))
              ) : ops.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">No Operations cataloged yet.</td></tr>
              ) : (
                ops.map(op => (
                  <tr key={op._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono font-semibold text-violet-400">{op.operationCode}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-white">{op.operationName}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{op.description}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">
                      {op.workCenterId?.workCenterName || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300 font-mono">
                      {op.standardDurationMinutes} minutes
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">
                      Seq {op.sequence}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${op.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {op.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {canManage && (
                        <button
                          onClick={() => handleOpenEdit(op)}
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white">{editingOp ? 'Edit Operation' : 'Create Operation'}</h3>
            <div>
              <label className={LabelCls}>Operation Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.operationName}
                onChange={e => setFormData({ ...formData, operationName: e.target.value })}
                className={InputCls}
                required
              />
            </div>
            <div>
              <label className={LabelCls}>Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>
            <div>
              <label className={LabelCls}>Work Center Assignment <span className="text-red-400">*</span></label>
              <select
                value={formData.workCenterId}
                onChange={e => setFormData({ ...formData, workCenterId: e.target.value })}
                className={InputCls}
                required
              >
                <option value="">Select Work Center</option>
                {(wcsData || []).map(wc => (
                  <option key={wc._id} value={wc._id}>{wc.workCenterName} ({wc.workCenterCode})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LabelCls}>Standard Duration (mins)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.standardDurationMinutes}
                  onChange={e => setFormData({ ...formData, standardDurationMinutes: e.target.value })}
                  className={InputCls}
                  required
                />
              </div>
              <div>
                <label className={LabelCls}>Sequence (Routing Order)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.sequence}
                  onChange={e => setFormData({ ...formData, sequence: e.target.value })}
                  className={InputCls}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-400 bg-slate-800 border border-slate-700 rounded-xl hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {editingOp ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
