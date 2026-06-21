import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Eye, Factory } from 'lucide-react'
import SearchInput from '../../components/common/SearchInput'
import { manufacturingApi } from '../../api/manufacturing.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const MFG_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER]

const STATUS_COLORS = {
  'DRAFT':                  'bg-slate-700 text-slate-300',
  'CONFIRMED':              'bg-blue-500/15 text-blue-400',
  'WAITING_FOR_COMPONENTS': 'bg-indigo-500/15 text-indigo-400',
  'IN_PROGRESS':            'bg-amber-500/15 text-amber-400',
  'DONE':                   'bg-emerald-500/15 text-emerald-400',
  'CANCELLED':              'bg-red-500/15 text-red-400',
  'REJECTED':               'bg-rose-500/15 text-rose-400',
}

const STATUS_OPTIONS = ['DRAFT', 'CONFIRMED', 'WAITING_FOR_COMPONENTS', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'REJECTED']

export default function ManufacturingOrdersPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole(MFG_ROLES)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['manufacturing-orders', { search, status, page }],
    queryFn:  () => manufacturingApi.getManufacturingOrders({ search: search || undefined, status: status || undefined, page, limit: 15 }),
    select:   r => r.data,
  })

  const orders = data?.data?.orders || []
  const meta   = data?.data?.meta   || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manufacturing Orders</h1>
          <p className="text-slate-400 text-sm mt-1">Manage production cycles and outputs</p>
        </div>
        {canManage && (
          <Link
            to="/manufacturing/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Plus size={16} /> New MO
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchInput
          id="search-manufacturing-orders"
          placeholder="Search MO number or product..."
          defaultValue={search}
          onSearch={(val) => { setSearch(val); setPage(1) }}
          className="flex-1 min-w-48"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-primary-500"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">MO Number</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Finished Product</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Work Center</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Scheduled Date</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Planned Qty</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Produced Qty</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-slate-700/50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr><td colSpan={8} className="text-center py-10 text-red-400">Failed to load manufacturing orders</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-500">
                    <Factory size={40} className="mx-auto mb-2 opacity-30" />
                    <p>No manufacturing orders found</p>
                    {canManage && <Link to="/manufacturing/new" className="text-primary-400 text-sm mt-1 inline-block">Create first MO →</Link>}
                  </td>
                </tr>
              ) : (
                orders.map(mo => (
                  <tr key={mo._id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-mono font-semibold text-primary-400">{mo.moNumber}</span>
                        {mo.createdAutomatically && (
                          <span className="inline-flex items-center w-max mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Auto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white font-medium">{mo.productId?.productName || '—'}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-500 font-mono">{mo.productId?.sku}</span>
                        {mo.sourceSalesOrderNumber && (
                          <>
                            <span className="text-slate-600 text-xs">•</span>
                            <span className="text-xs text-slate-400">
                              SO:{' '}
                              {mo.linkedSoId ? (
                                <Link to={`/sales/${mo.linkedSoId}`} className="text-primary-400 hover:underline font-semibold font-mono">
                                  {mo.sourceSalesOrderNumber}
                                </Link>
                              ) : (
                                <span className="font-mono">{mo.sourceSalesOrderNumber}</span>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {mo.workCenterId ? (
                        <div>
                          <p className="text-sm text-white">{mo.workCenterId.name}</p>
                          <p className="text-xs text-slate-500">{mo.workCenterId.code}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {mo.scheduledDate ? new Date(mo.scheduledDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm text-white">{mo.plannedQty}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-white">{mo.producedQty}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[mo.status]}`}>
                        {mo.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/manufacturing/${mo._id}`} className="text-slate-500 hover:text-primary-400 transition-colors">
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
            Page {meta.page} of {meta.totalPages} · {meta.total} orders
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
