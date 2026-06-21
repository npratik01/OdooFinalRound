import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Filter, Eye, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import SearchInput from '../../components/common/SearchInput'
import { purchaseApi } from '../../api/purchase.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const PURCHASE_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER]

const STATUS_COLORS = {
  'Draft':              'bg-slate-700 text-slate-300',
  'Confirmed':          'bg-blue-500/15 text-blue-400',
  'Partially Received': 'bg-amber-500/15 text-amber-400',
  'Fully Received':     'bg-emerald-500/15 text-emerald-400',
  'Cancelled':          'bg-red-500/15 text-red-400',
}

const STATUS_OPTIONS = ['Draft', 'Confirmed', 'Partially Received', 'Fully Received', 'Cancelled']

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole(PURCHASE_ROLES)

  const [search, setSearch] = useState('')   // committed (sent to API)
  const [status, setStatus] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['purchase-orders', { search, status, page }],
    queryFn:  () => purchaseApi.getPurchaseOrders({ search: search || undefined, status: status || undefined, page, limit: 15 }),
    select:   r => r.data,
  })

  const orders = data?.data?.orders || []
  const meta   = data?.data?.meta   || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Purchase Orders</h1>
          <p className="text-slate-400 text-sm mt-1">Manage procurement from vendors</p>
        </div>
        {canManage && (
          <Link
            to="/purchase-orders/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Plus size={16} /> New PO
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchInput
          id="search-purchase-orders"
          placeholder="Search PO number or vendor..."
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
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">PO Number</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Vendor</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Order Date</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Expected Delivery</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Amount</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Items</th>
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
                <tr><td colSpan={8} className="text-center py-10 text-red-400">Failed to load purchase orders</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-500">
                    <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
                    <p>No purchase orders found</p>
                    {canManage && <Link to="/purchase-orders/new" className="text-primary-400 text-sm mt-1 inline-block">Create first PO →</Link>}
                  </td>
                </tr>
              ) : (
                orders.map(po => (
                  <tr key={po._id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono font-semibold text-primary-400">{po.poNumber}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white">{po.vendorId?.vendorName || '—'}</p>
                      <p className="text-xs text-slate-500">{po.vendorId?.vendorCode}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {new Date(po.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-white">₹{po.totalAmount?.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-slate-300">
                      {po.items?.length}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[po.status]}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/purchase-orders/${po._id}`} className="text-slate-500 hover:text-primary-400 transition-colors">
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
