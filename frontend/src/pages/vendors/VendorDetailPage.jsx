import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit, ToggleLeft, ToggleRight, Star, Building2, Phone, Mail, MapPin, Calendar, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { vendorApi } from '../../api/vendor.api'
import { purchaseApi } from '../../api/purchase.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const PURCHASE_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER]

const StarRating = ({ rating }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <Star key={s} size={16} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
    ))}
  </div>
)

const InfoRow = ({ icon: Icon, label, value }) => value ? (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
    <Icon size={15} className="text-slate-500 mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-200">{value}</p>
    </div>
  </div>
) : null

const POStatusColors = {
  'Draft': 'bg-slate-700 text-slate-300',
  'Confirmed': 'bg-blue-500/15 text-blue-400',
  'Partially Received': 'bg-amber-500/15 text-amber-400',
  'Fully Received': 'bg-emerald-500/15 text-emerald-400',
  'Cancelled': 'bg-red-500/15 text-red-400',
}

export default function VendorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole(PURCHASE_ROLES)

  const { data: vendorData, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorApi.getVendorById(id),
    select: r => r.data?.data,
  })

  const { data: posData } = useQuery({
    queryKey: ['purchase-orders', { vendorId: id }],
    queryFn: () => purchaseApi.getPurchaseOrders({ vendorId: id, limit: 5 }),
    select: r => r.data?.data,
  })

  const toggleMutation = useMutation({
    mutationFn: () => vendorApi.toggleVendorStatus(id),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success(r.data?.data?.isActive ? 'Vendor activated' : 'Vendor deactivated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  if (isLoading) return (
    <div className="p-6">
      <div className="h-64 bg-slate-800/50 rounded-2xl animate-pulse" />
    </div>
  )

  if (!vendorData) return (
    <div className="p-6 text-center text-slate-400">Vendor not found</div>
  )

  const recentPOs = posData?.orders || []

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          {canManage && (
            <>
              <button
                onClick={() => toggleMutation.mutate()}
                disabled={toggleMutation.isPending}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:border-primary-500 transition-all"
              >
                {vendorData.isActive ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} />}
                {vendorData.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <Link
                to={`/vendors/${id}/edit`}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
              >
                <Edit size={14} /> Edit
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                {vendorData.vendorName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">{vendorData.vendorName}</h2>
                <p className="text-sm text-slate-400">{vendorData.vendorCode}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${vendorData.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  {vendorData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={vendorData.rating} />
              <span className="text-sm text-slate-400">{vendorData.rating}/5</span>
            </div>
            <InfoRow icon={Building2} label="Contact Person" value={vendorData.contactPerson} />
            <InfoRow icon={Mail} label="Email" value={vendorData.email} />
            <InfoRow icon={Phone} label="Phone" value={vendorData.phone} />
            <InfoRow icon={MapPin} label="City / State" value={[vendorData.city, vendorData.state].filter(Boolean).join(', ')} />
            <InfoRow icon={MapPin} label="Country" value={vendorData.country} />
            {vendorData.gstNumber && <InfoRow icon={Building2} label="GST Number" value={vendorData.gstNumber} />}
          </div>

          {/* Terms Card */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Procurement Terms</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Payment Terms</p>
                <p className="text-sm font-semibold text-white mt-1">{vendorData.paymentTerms}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Lead Time</p>
                <p className="text-sm font-semibold text-white mt-1">{vendorData.leadTimeDays} days</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Added On</p>
              <p className="text-sm text-slate-300 mt-1">{new Date(vendorData.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Recent Purchase Orders */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Purchase Orders</h3>
            <Link to={`/purchase-orders?vendorId=${id}`} className="text-xs text-primary-400 hover:text-primary-300">
              View all →
            </Link>
          </div>

          {recentPOs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No purchase orders yet</p>
              {canManage && (
                <Link to="/purchase-orders/new" className="text-primary-400 text-xs mt-1 inline-block">
                  Create first PO →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {recentPOs.map(po => (
                <Link
                  key={po._id}
                  to={`/purchase-orders/${po._id}`}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl hover:bg-slate-900 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{po.poNumber}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar size={11} className="text-slate-500" />
                      <p className="text-xs text-slate-400">{new Date(po.orderDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-white">₹{po.totalAmount?.toLocaleString()}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${POStatusColors[po.status]}`}>
                      {po.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
