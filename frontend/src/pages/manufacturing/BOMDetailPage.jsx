import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Archive, Copy, Package, Cpu, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchBOMById, activateBOM, archiveBOM, cloneBOM } from '../../api/manufacturing.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const STATUS_COLORS = {
  'Draft':    'bg-slate-700/80 text-slate-300 border-slate-600',
  'Active':   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Archived': 'bg-red-500/15 text-red-400 border-red-500/30',
}

export default function BOMDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole([ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER])

  const { data: bom, isLoading } = useQuery({
    queryKey: ['bom', id],
    queryFn:  () => fetchBOMById(id),
    select:   r => r.data?.data?.bom,
  })

  const activateMutation = useMutation({
    mutationFn: () => activateBOM(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', id] })
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      toast.success('BoM Activated!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to activate BoM'),
  })

  const archiveMutation = useMutation({
    mutationFn: () => archiveBOM(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', id] })
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      toast.success('BoM Archived')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to archive BoM'),
  })

  const cloneMutation = useMutation({
    mutationFn: () => cloneBOM(id),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      toast.success(`BoM Cloned: ${r.data?.data?.bom?.bomCode}`)
      navigate(`/bom/${r.data?.data?.bom?._id}`)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to clone BoM'),
  })

  if (isLoading) return <div className="p-6"><div className="h-96 bg-slate-800/50 rounded-2xl animate-pulse" /></div>
  if (!bom) return <div className="p-6 text-center text-slate-400">Bill of Materials not found</div>

  const isDraft    = bom.status === 'Draft'
  const isActive   = bom.status === 'Active'

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          {canManage && (
            <>
              <button
                onClick={() => cloneMutation.mutate()}
                disabled={cloneMutation.isPending}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all"
              >
                <Copy size={14} /> Create Version Draft
              </button>
              {isDraft && (
                <button
                  onClick={() => { if (window.confirm('Activate this BoM?')) activateMutation.mutate() }}
                  disabled={activateMutation.isPending}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-sm transition-all"
                >
                  <CheckCircle size={14} /> Activate BoM
                </button>
              )}
              {isActive && (
                <button
                  onClick={() => { if (window.confirm('Archive this BoM?')) archiveMutation.mutate() }}
                  disabled={archiveMutation.isPending}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl text-sm transition-all"
                >
                  <Archive size={14} /> Archive BoM
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Info */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white font-mono">{bom.bomCode}</h1>
            <p className="text-slate-400 text-sm mt-1">Created by {bom.createdBy?.name || 'System'} · Version {bom.version}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${STATUS_COLORS[bom.status]}`}>
            {bom.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 flex items-center gap-3">
            <Package size={20} className="text-violet-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Target Finished Good Product</p>
              <p className="text-sm font-semibold text-white">{bom.productId?.productName}</p>
              <p className="text-xs text-slate-400">SKU: {bom.productId?.sku}</p>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 flex items-center gap-3">
            <ClipboardList size={20} className="text-blue-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Revision Description</p>
              <p className="text-sm text-slate-300 font-medium">{bom.description || 'No description provided.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Components Grid */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-700/50 flex items-center gap-2">
          <Package size={16} className="text-violet-400" />
          <h2 className="font-semibold text-white">Bill of Materials Component Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/30">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Component / Product</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Qty Required per 1 FG unit</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Unit of Measure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {bom.components?.map((comp, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-white">{comp.productId?.productName}</p>
                    <p className="text-xs text-slate-500">{comp.productId?.sku}</p>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-white font-semibold">{comp.quantityRequired}</td>
                  <td className="px-5 py-3.5 text-left text-sm text-slate-400">{comp.unit || 'Units'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operations sequence */}
      {bom.operations && bom.operations.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-700/50 flex items-center gap-2">
            <Cpu size={16} className="text-violet-400" />
            <h2 className="font-semibold text-white">Routing sequence operations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Sequence</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Operation Code</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Operation Name</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Work Center Assignment</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Standard Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {bom.operations.map((op, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-xs text-violet-400 font-bold border border-violet-500/20">
                        {op.sequence}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-violet-400 font-mono font-medium">{op.operationId?.operationCode}</td>
                    <td className="px-5 py-3.5 text-sm text-white font-medium">{op.operationId?.operationName}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{op.operationId?.workCenterId?.workCenterName || '—'}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-300 font-mono">{op.operationId?.standardDurationMinutes} minutes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
