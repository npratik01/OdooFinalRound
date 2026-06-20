import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Eye, Copy, CheckCircle, Archive } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchBOMs, cloneBOM, activateBOM, archiveBOM } from '../../api/manufacturing.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const STATUS_STYLES = {
  'Draft':    'bg-slate-700 text-slate-300 border-slate-600',
  'Active':   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Archived': 'bg-red-500/15 text-red-400 border-red-500/30',
}

export default function BOMListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole([ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER])

  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['boms', { search, page }],
    queryFn:  () => fetchBOMs({ search, page, limit: 15 }),
    select:   r => r.data?.data,
  })

  const boms = data?.boms || []
  const meta = data?.meta || {}

  const cloneMutation = useMutation({
    mutationFn: (id) => cloneBOM(id),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      toast.success(`BoM Cloned: ${r.data?.data?.bom?.bomCode}`)
      navigate(`/bom/${r.data?.data?.bom?._id}`)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to clone BoM'),
  })

  const activateMutation = useMutation({
    mutationFn: (id) => activateBOM(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      toast.success('BoM status activated!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to activate BoM'),
  })

  const archiveMutation = useMutation({
    mutationFn: (id) => archiveBOM(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      toast.success('BoM archived')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to archive BoM'),
  })

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Bill of Materials (BoM)
          </h1>
          <p className="text-slate-400 text-sm mt-1">{meta.total || 0} active BoMs total</p>
        </div>
        <Link to="/bom/new"
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> New BoM
        </Link>
      </div>

      {/* Filter */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id="bom-search"
          type="text"
          placeholder="Search BoM code or product name…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['BoM Code', 'Product', 'Version', 'Components count', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-4 bg-slate-700/40 rounded animate-pulse" /></td></tr>
                  ))
                : boms.length === 0
                ? <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">No Bills of Materials found.</td></tr>
                : boms.map(bom => (
                    <tr key={bom._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono font-semibold text-violet-400">{bom.bomCode}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white">{bom.productId?.productName || '—'}</p>
                        <p className="text-xs text-slate-500">{bom.productId?.sku}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-300">v{bom.version}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">
                        {bom.components?.length || 0} items
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[bom.status]}`}>
                          {bom.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button
                            id={`bom-view-${bom._id}`}
                            onClick={() => navigate(`/bom/${bom._id}`)}
                            title="View BoM"
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          {canManage && (
                            <>
                              <button
                                onClick={() => cloneMutation.mutate(bom._id)}
                                title="Clone / Version BoM"
                                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-violet-400 transition-colors"
                              >
                                <Copy size={14} />
                              </button>
                              {bom.status === 'Draft' && (
                                <button
                                  onClick={() => { if (window.confirm('Activate this BoM version?')) activateMutation.mutate(bom._id) }}
                                  title="Activate BoM"
                                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              {bom.status === 'Active' && (
                                <button
                                  onClick={() => { if (window.confirm('Archive this BoM?')) archiveMutation.mutate(bom._id) }}
                                  title="Archive BoM"
                                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                                >
                                  <Archive size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-700/30">
            <p className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white rounded-lg transition-colors">
                Previous
              </button>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white rounded-lg transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
