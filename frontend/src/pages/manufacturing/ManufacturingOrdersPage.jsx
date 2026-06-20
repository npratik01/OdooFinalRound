import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Eye, ClipboardList } from 'lucide-react'
import { fetchManufacturingOrders } from '../../api/manufacturing.api'

const STATUS_STYLES = {
  'Draft':       'bg-slate-700 text-slate-300',
  'Confirmed':   'bg-blue-500/15 text-blue-400',
  'Ready':       'bg-purple-500/15 text-purple-400',
  'In Progress': 'bg-amber-500/15 text-amber-400',
  'Completed':   'bg-emerald-500/15 text-emerald-400',
  'Cancelled':   'bg-red-500/15 text-red-400',
}

const StatusBadge = ({ status }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status] || 'bg-slate-700 text-slate-300'}`}>
    {status}
  </span>
)

const STATUSES = ['', 'Draft', 'Confirmed', 'Ready', 'In Progress', 'Completed', 'Cancelled']

export default function ManufacturingOrdersPage() {
  const navigate = useNavigate()
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [page, setPage]       = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['manufacturing-orders', { search, status, page }],
    queryFn:  () => fetchManufacturingOrders({ search, status, page, limit: 15 }),
    select:   r => r.data?.data,
  })

  const orders = data?.orders || []
  const meta   = data?.meta   || {}

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList size={22} className="text-violet-400" />
            Manufacturing Orders
          </h1>
          <p className="text-slate-400 text-sm mt-1">{meta.total || 0} orders total</p>
        </div>
        <Link to="/manufacturing/new"
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> New MO
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="mo-search"
            type="text"
            placeholder="Search MO number…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            id="mo-status-filter"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 appearance-none"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['MO Number', 'Product', 'BoM', 'Qty to Produce', 'Qty Produced', 'Status', 'Planned Start', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-5 py-4"><div className="h-4 bg-slate-700/40 rounded animate-pulse" /></td></tr>
                  ))
                : orders.length === 0
                ? <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">No manufacturing orders found.</td></tr>
                : orders.map(mo => (
                    <tr key={mo._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono font-semibold text-violet-400">{mo.moNumber}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white">{mo.productId?.productName || '—'}</p>
                        <p className="text-xs text-slate-500">{mo.productId?.sku}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400 font-mono">{mo.bomId?.bomCode || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-white font-semibold">{mo.quantityToProduce}</td>
                      <td className="px-5 py-3.5 text-sm text-emerald-400 font-semibold">{mo.quantityProduced ?? 0}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={mo.status} /></td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">
                        {mo.plannedStartDate ? new Date(mo.plannedStartDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          id={`mo-view-${mo._id}`}
                          onClick={() => navigate(`/manufacturing/${mo._id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye size={15} />
                        </button>
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
