import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, ToggleLeft, ToggleRight, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchWorkCenters, createWorkCenter, updateWorkCenter, toggleWorkCenterStatus } from '../../api/manufacturing.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const InputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
const LabelCls = "block text-xs font-medium text-slate-400 mb-1.5"

export default function WorkCentersPage() {
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole([ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER])

  const [showModal, setShowModal] = useState(false)
  const [editingWc, setEditingWc] = useState(null)
  const [formData, setFormData] = useState({
    workCenterName: '',
    description: '',
    capacityPerDay: 8,
    efficiencyPercentage: 100,
  })

  // Queries & Mutations
  const { data, isLoading } = useQuery({
    queryKey: ['work-centers'],
    queryFn:  () => fetchWorkCenters({ limit: 100 }),
    select:   r => r.data?.data,
  })

  const wcs = data?.workCenters || []

  const createMutation = useMutation({
    mutationFn: (data) => createWorkCenter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-centers'] })
      toast.success('Work Center created!')
      setShowModal(false)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create Work Center'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateWorkCenter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-centers'] })
      toast.success('Work Center updated!')
      setShowModal(false)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to update Work Center'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => toggleWorkCenterStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-centers'] })
      toast.success('Work Center status toggled')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to toggle status'),
  })

  const handleOpenCreate = () => {
    setEditingWc(null)
    setFormData({
      workCenterName: '',
      description: '',
      capacityPerDay: 8,
      efficiencyPercentage: 100,
    })
    setShowModal(true)
  }

  const handleOpenEdit = (wc) => {
    setEditingWc(wc)
    setFormData({
      workCenterName:       wc.workCenterName,
      description:          wc.description || '',
      capacityPerDay:       wc.capacityPerDay || 8,
      efficiencyPercentage: wc.efficiencyPercentage || 100,
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      capacityPerDay:       parseFloat(formData.capacityPerDay),
      efficiencyPercentage: parseFloat(formData.efficiencyPercentage),
    }
    if (editingWc) {
      updateMutation.mutate({ id: editingWc._id, data: payload })
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
            <Settings size={22} className="text-violet-400" />
            Work Centers
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage physical production lines & efficiency targets</p>
        </div>
        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={16} /> New Work Center
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-44 bg-slate-800/50 rounded-2xl animate-pulse" />)
        ) : wcs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">No Work Centers configured.</div>
        ) : (
          wcs.map(wc => (
            <div key={wc._id} className={`bg-slate-800/60 border ${wc.isActive ? 'border-slate-700/50' : 'border-red-500/20'} rounded-2xl p-5 space-y-4 hover:border-violet-500/30 transition-all`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-base">{wc.workCenterName}</h3>
                  <span className="text-xs font-mono text-violet-400 font-medium">{wc.workCenterCode}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${wc.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {wc.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-slate-400 line-clamp-2 h-10">{wc.description || 'No description provided.'}</p>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/40">
                <div>
                  <p className="text-xs text-slate-500">Capacity/Day</p>
                  <p className="text-sm font-semibold text-white">{wc.capacityPerDay} Hours</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Efficiency Target</p>
                  <p className="text-sm font-semibold text-emerald-400">{wc.efficiencyPercentage}%</p>
                </div>
              </div>

              {canManage && (
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/20">
                  <button
                    onClick={() => handleOpenEdit(wc)}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate(wc._id)}
                    className={`p-1.5 rounded-lg hover:bg-slate-700 transition-colors ${wc.isActive ? 'text-emerald-400' : 'text-slate-500'}`}
                  >
                    {wc.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Slide-over or Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white">{editingWc ? 'Edit Work Center' : 'Create Work Center'}</h3>
            <div>
              <label className={LabelCls}>Work Center Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.workCenterName}
                onChange={e => setFormData({ ...formData, workCenterName: e.target.value })}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LabelCls}>Capacity Per Day (Hours)</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={formData.capacityPerDay}
                  onChange={e => setFormData({ ...formData, capacityPerDay: e.target.value })}
                  className={InputCls}
                  required
                />
              </div>
              <div>
                <label className={LabelCls}>Efficiency Target (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.efficiencyPercentage}
                  onChange={e => setFormData({ ...formData, efficiencyPercentage: e.target.value })}
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
                {editingWc ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
