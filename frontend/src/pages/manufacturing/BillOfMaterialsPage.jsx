import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Eye, Cpu } from 'lucide-react'
import SearchInput from '../../components/common/SearchInput'
import { bomApi } from '../../api/bom.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const MFG_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER]

export default function BillOfMaterialsPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole(MFG_ROLES)

  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['boms', { search, isActive, page }],
    queryFn:  () => bomApi.getBoms({
      search: search || undefined,
      isActive: isActive || undefined,
      page,
      limit: 15
    }),
    select:   r => r.data,
  })

  const boms = data?.data?.boms || []
  const meta   = data?.data?.meta   || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bill of Materials</h1>
          <p className="text-slate-400 text-sm mt-1">Manage components recipes for manufactured goods</p>
        </div>
        {canManage && (
          <Link
            to="/bom/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Plus size={16} /> New BoM
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchInput
          id="search-bom"
          placeholder="Search BoM code or product name..."
          defaultValue={search}
          onSearch={(val) => { setSearch(val); setPage(1) }}
          className="flex-1 min-w-48"
        />
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
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">BoM Code</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Finished Product</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Output Qty</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Version</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Components Count</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-slate-700/50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr><td colSpan={7} className="text-center py-10 text-red-400">Failed to load Bills of Materials</td></tr>
              ) : boms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <Cpu size={40} className="mx-auto mb-2 opacity-30" />
                    <p>No Bills of Materials found</p>
                    {canManage && <Link to="/bom/new" className="text-primary-400 text-sm mt-1 inline-block">Create first BoM →</Link>}
                  </td>
                </tr>
              ) : (
                boms.map(bom => (
                  <tr key={bom._id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-primary-400">
                      {bom.bomCode}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white font-medium">{bom.productId?.productName || '—'}</p>
                      <p className="text-xs text-slate-500 font-mono">{bom.productId?.sku}</p>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-slate-300">
                      {bom.quantity}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-slate-300">
                      v{bom.version}
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-slate-300">
                      {bom.components?.length} item(s)
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        bom.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {bom.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/bom/${bom._id}`} className="text-slate-500 hover:text-primary-400 transition-colors">
                        <Eye size={16} />
                      </Link>
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
            Page {meta.page} of {meta.totalPages} · {meta.total} recipes
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
    </div>
  )
}
