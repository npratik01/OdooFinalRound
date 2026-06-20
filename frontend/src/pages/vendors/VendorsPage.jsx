import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Star, Building2, Phone, Mail, ToggleLeft, ToggleRight, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { vendorApi } from '../../api/vendor.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const PURCHASE_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER]

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        size={12}
        className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
      />
    ))}
  </div>
)

export default function VendorsPage() {
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole(PURCHASE_ROLES)

  const [search, setSearch]     = useState('')
  const [isActive, setIsActive] = useState('')
  const [page, setPage]         = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vendors', { search, isActive, page }],
    queryFn: () => vendorApi.getVendors({ search: search || undefined, isActive: isActive || undefined, page, limit: 12 }),
    select: r => r.data,
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => vendorApi.toggleVendorStatus(id),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success(r.data?.data?.isActive ? 'Vendor activated' : 'Vendor deactivated')
    },
    onError: () => toast.error('Failed to update vendor status'),
  })

  const vendors = data?.data?.vendors || []
  const meta    = data?.data?.meta   || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendors</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your supplier database</p>
        </div>
        {canManage && (
          <Link
            to="/vendors/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Plus size={16} /> New Vendor
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search vendors..."
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
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-red-400">Failed to load vendors</div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>No vendors found</p>
          {canManage && <Link to="/vendors/new" className="text-primary-400 text-sm mt-2 inline-block">Create your first vendor →</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(vendor => (
            <div key={vendor._id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-primary-500/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {vendor.vendorName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm leading-tight">{vendor.vendorName}</p>
                    <p className="text-xs text-slate-500">{vendor.vendorCode}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${vendor.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                {vendor.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Mail size={11} className="text-slate-600 shrink-0" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Phone size={11} className="text-slate-600 shrink-0" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-slate-600">Lead:</span>
                  <span>{vendor.leadTimeDays}d</span>
                  <span className="text-slate-600 ml-2">Terms:</span>
                  <span>{vendor.paymentTerms}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <StarRating rating={vendor.rating} />
                <div className="flex gap-2">
                  {canManage && (
                    <button
                      onClick={() => toggleMutation.mutate(vendor._id)}
                      disabled={toggleMutation.isPending}
                      className="text-slate-500 hover:text-primary-400 transition-colors"
                      title={vendor.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {vendor.isActive ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} />}
                    </button>
                  )}
                  <Link to={`/vendors/${vendor._id}`} className="text-slate-500 hover:text-primary-400 transition-colors">
                    <Eye size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {meta.page} of {meta.totalPages} · {meta.total} vendors
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 disabled:opacity-40 hover:border-primary-500 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 disabled:opacity-40 hover:border-primary-500 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
