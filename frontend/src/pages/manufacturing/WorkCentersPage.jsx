import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, Wrench, XCircle, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { workCenterApi } from '../../api/workCenter.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const MFG_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER]

export default function WorkCentersPage() {
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole(MFG_ROLES)

  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('')
  const [page, setPage]     = useState(1)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWc, setEditingWc]     = useState(null) // null if creating, else work center object
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [capacity, setCapacity]       = useState('0')
  const [costPerHour, setCostPerHour] = useState('0')

  // Fetch Work Centers
  const { data, isLoading, isError } = useQuery({
    queryKey: ['work-centers', { search, isActive, page }],
    queryFn:  () => workCenterApi.getWorkCenters({
      search: search || undefined,
      isActive: isActive || undefined,
      page,
      limit: 15
    }),
    select:   r => r.data,
  })

  const workCenters = data?.data?.workCenters || []
  const meta   = data?.data?.meta   || {}

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload) => workCenterApi.createWorkCenter(payload),
    onSuccess: (res) => {
      toast.success(`Work Center ${res.data?.data?.code} created successfully!`)
      queryClient.invalidateQueries({ queryKey: ['work-centers'] })
      setIsModalOpen(false)
      resetForm()
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create work center'),
  })

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => workCenterApi.updateWorkCenter(id, payload),
    onSuccess: (res) => {
      toast.success(`Work Center ${res.data?.data?.code} updated successfully!`)
      queryClient.invalidateQueries({ queryKey: ['work-centers'] })
      setIsModalOpen(false)
      resetForm()
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to update work center'),
  })

  // Toggle Active Mutation
  const toggleMutation = useMutation({
    mutationFn: (id) => workCenterApi.toggleWorkCenter(id),
    onSuccess: (res) => {
      toast.success(`Work Center status changed to: ${res.data?.data?.isActive ? 'Active' : 'Inactive'}`)
      queryClient.invalidateQueries({ queryKey: ['work-centers'] })
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to toggle work center status'),
  })

  const resetForm = () => {
    setEditingWc(null)
    setName('')
    setDescription('')
    setCapacity('0')
    setCostPerHour('0')
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (wc) => {
    setEditingWc(wc)
    setName(wc.name)
    setDescription(wc.description || '')
    setCapacity(String(wc.capacity || 0))
    setCostPerHour(String(wc.costPerHour || 0))
    setIsModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Work Center Name is required')
      return
    }

    const payload = {
      name,
      description,
      capacity: parseInt(capacity, 10) || 0,
      costPerHour: parseFloat(costPerHour) || 0,
    }

    if (editingWc) {
      updateMutation.mutate({ id: editingWc._id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Work Centers</h1>
          <p className="text-slate-400 text-sm mt-1">Manage production stations, capacities, and costs</p>
        </div>
        {canManage && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Plus size={16} /> New Station
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search work center name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={isActive}
          onChange={e => { setIsActive(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Code</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Name</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Description</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Capacity (units/hr)</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Cost/Hour</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-slate-700/50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr><td colSpan={7} className="text-center py-10 text-red-400">Failed to load Work Centers</td></tr>
              ) : workCenters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <Wrench size={40} className="mx-auto mb-2 opacity-30" />
                    <p>No Work Centers found</p>
                    {canManage && <button onClick={handleOpenCreateModal} className="text-primary-400 text-sm mt-1 inline-block">Create first Work Center →</button>}
                  </td>
                </tr>
              ) : (
                workCenters.map(wc => (
                  <tr key={wc._id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-primary-400">
                      {wc.code}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-white">
                      {wc.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400 max-w-xs truncate">
                      {wc.description || '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-slate-300">
                      {wc.capacity}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-white">
                      ₹{wc.costPerHour?.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        wc.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {wc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {canManage && (
                          <button
                            onClick={() => toggleMutation.mutate(wc._id)}
                            title={wc.isActive ? 'Deactivate Work Center' : 'Activate Work Center'}
                            className="text-slate-500 hover:text-primary-400 transition-colors p-1"
                          >
                            {wc.isActive ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} />}
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => handleOpenEditModal(wc)}
                            className="text-slate-500 hover:text-primary-400 transition-colors p-1"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {meta.page} of {meta.totalPages} · {meta.total} stations
          </p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 disabled:opacity-40 hover:border-primary-500 transition-colors">
              Previous
            </button>
            <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 disabled:opacity-40 hover:border-primary-500 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingWc ? `Edit Work Center: ${editingWc.code}` : 'Create Work Center'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Work Center Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CNC Milling Station #1"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Details about components or location..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Capacity (units/hr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Cost Per Hour (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={costPerHour}
                    onChange={e => setCostPerHour(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 p-3 bg-slate-900/30 rounded-xl border border-slate-700/30 text-xs text-slate-400 mt-2">
                <Info size={16} className="text-primary-400 shrink-0 mt-0.5" />
                <p>
                  Work Center capacity and hourly running rates are used to calculate scheduling windows and production routing sheets.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
