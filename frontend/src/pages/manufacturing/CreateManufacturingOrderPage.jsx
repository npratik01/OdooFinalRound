import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Save, Factory, Calendar, Info, Cpu, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'
import { bomApi } from '../../api/bom.api'
import { workCenterApi } from '../../api/workCenter.api'
import { manufacturingApi } from '../../api/manufacturing.api'

export default function CreateManufacturingOrderPage() {
  const navigate = useNavigate()

  const [selectedBomId, setSelectedBomId] = useState('')
  const [plannedQty, setPlannedQty] = useState('1')
  const [workCenterId, setWorkCenterId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [remarks, setRemarks] = useState('')

  // 1. Fetch Active BoMs
  const { data: bomsData, isLoading: bomsLoading } = useQuery({
    queryKey: ['active-boms'],
    queryFn:  () => bomApi.getBoms({ isActive: 'true', limit: 100 }),
    select:   r => r.data?.data?.boms || [],
  })

  // 2. Fetch Active Work Centers
  const { data: workCentersData, isLoading: wcLoading } = useQuery({
    queryKey: ['active-work-centers'],
    queryFn:  () => workCenterApi.getWorkCenters({ isActive: 'true', limit: 100 }),
    select:   r => r.data?.data?.workCenters || [],
  })

  // Find selected BoM object
  const selectedBom = bomsData?.find(b => b._id === selectedBomId)

  // Calculate exploded components
  const qty = parseInt(plannedQty, 10) || 0
  const bomOutputQty = selectedBom?.quantity || 1
  const multiplier = qty / bomOutputQty
  const explodedComponents = selectedBom?.components?.map(comp => ({
    ...comp,
    requiredQty: Math.ceil(comp.quantity * multiplier)
  })) || []

  // Create MO Mutation
  const createMutation = useMutation({
    mutationFn: (payload) => manufacturingApi.createManufacturingOrder(payload),
    onSuccess: (res) => {
      toast.success(`Manufacturing Order ${res.data?.data?.moNumber} created in DRAFT!`)
      navigate(`/manufacturing/${res.data?.data?._id}`)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create MO'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedBomId) {
      toast.error('Please select a Bill of Materials')
      return
    }
    if (qty <= 0) {
      toast.error('Planned Quantity must be greater than 0')
      return
    }
    createMutation.mutate({
      bomId: selectedBomId,
      plannedQty: qty,
      workCenterId: workCenterId || undefined,
      scheduledDate: scheduledDate || undefined,
      remarks,
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-bold text-white">Create Manufacturing Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Details Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary-400 mb-2">
            <Factory size={18} />
            <h2 className="font-semibold text-white">Production Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bill of Materials Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Bill of Materials (Finished Product) *
              </label>
              <select
                required
                value={selectedBomId}
                onChange={e => {
                  setSelectedBomId(e.target.value)
                  // Auto-set planned quantity to match BoM output qty
                  const bom = bomsData?.find(b => b._id === e.target.value)
                  if (bom) setPlannedQty(String(bom.quantity || 1))
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-primary-500"
              >
                <option value="">Select BoM...</option>
                {bomsLoading ? (
                  <option disabled>Loading BoMs...</option>
                ) : (
                  bomsData?.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.productId?.productName} ({b.bomCode} - v{b.version})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Planned Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Planned Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={plannedQty}
                onChange={e => setPlannedQty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Work Center */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Work Center (Optional)
              </label>
              <select
                value={workCenterId}
                onChange={e => setWorkCenterId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-primary-500"
              >
                <option value="">Select Work Center...</option>
                {wcLoading ? (
                  <option disabled>Loading Work Centers...</option>
                ) : (
                  workCentersData?.map(wc => (
                    <option key={wc._id} value={wc._id}>
                      {wc.name} ({wc.code})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Scheduled Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Remarks / Production Notes
            </label>
            <textarea
              rows="3"
              placeholder="Add additional guidelines for the floor managers..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Exploded Components Preview */}
        {selectedBom && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary-400">
                <Cpu size={18} />
                <h2 className="font-semibold text-white">Component Requirements (Exploded)</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">BoM: {selectedBom.bomCode} (v{selectedBom.version})</span>
            </div>

            <div className="border border-slate-700/40 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/30 border-b border-slate-700/40">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-2">Component</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase px-4 py-2">Base Qty</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase px-4 py-2">Total Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/20">
                  {explodedComponents.map((comp, i) => (
                    <tr key={i} className="hover:bg-slate-800/25">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{comp.productId?.productName}</p>
                        <p className="text-xs text-slate-500 font-mono">{comp.productId?.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-400">{comp.quantity} {comp.uom}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-primary-400">{comp.requiredQty} {comp.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 p-3 bg-slate-900/30 rounded-xl border border-slate-700/30 text-xs text-slate-400">
              <Info size={16} className="text-primary-400 shrink-0 mt-0.5" />
              <p>
                Required quantities are automatically scaled based on your planned quantity compared to the Bill of Materials base output of {selectedBom.quantity} unit(s).
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Save size={16} />
            {createMutation.isPending ? 'Saving...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  )
}
