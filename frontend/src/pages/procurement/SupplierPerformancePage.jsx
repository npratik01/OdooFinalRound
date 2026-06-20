import { useQuery } from '@tanstack/react-query'
import { Star, TrendingUp, TrendingDown, Package, CheckCircle2, XCircle, Clock, IndianRupee } from 'lucide-react'
import { procurementApi } from '../../api/procurement.api'

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} size={13} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
    ))}
  </div>
)

const MetricBadge = ({ icon: Icon, label, value, color }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60`}>
    <Icon size={13} className={color} />
    <div>
      <p className="text-xs text-slate-500 leading-none">{label}</p>
      <p className={`text-sm font-bold ${color} leading-tight`}>{value}</p>
    </div>
  </div>
)

const FulfillmentBar = ({ rate }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${rate}%`,
          background: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444'
        }}
      />
    </div>
    <span className={`text-xs font-bold ${rate >= 80 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
      {rate}%
    </span>
  </div>
)

export default function SupplierPerformancePage() {
  const { data: vendors, isLoading, isError } = useQuery({
    queryKey: ['supplier-performance'],
    queryFn:  () => procurementApi.getSupplierPerformance(),
    select:   r => r.data?.data,
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Supplier Performance</h1>
        <p className="text-slate-400 text-sm mt-1">Vendor scorecards, fulfillment rates, and procurement metrics</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-slate-800/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-red-400">Failed to load supplier performance data</div>
      ) : vendors?.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>No active vendors found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vendors.map((vendor, rank) => (
            <div key={vendor.vendorId} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-primary-500/20 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    rank === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    rank === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                    rank === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    #{rank + 1}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                    {vendor.vendorName?.charAt(0)?.toUpperCase()}
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">{vendor.vendorName}</h3>
                    <p className="text-xs text-slate-400">{vendor.vendorCode}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={vendor.rating} />
                      <span className="text-xs text-slate-500">{vendor.contactPerson}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Fulfillment Rate</p>
                  <p className={`text-2xl font-bold ${
                    vendor.fulfillmentRate >= 80 ? 'text-emerald-400' :
                    vendor.fulfillmentRate >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>{vendor.fulfillmentRate}%</p>
                </div>
              </div>

              {/* Fulfillment Progress Bar */}
              <div className="mb-4">
                <FulfillmentBar rate={vendor.fulfillmentRate} />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                <MetricBadge icon={Package}      label="Total Orders"   value={vendor.totalOrders}       color="text-slate-300" />
                <MetricBadge icon={CheckCircle2} label="Completed"      value={vendor.completedOrders}   color="text-emerald-400" />
                <MetricBadge icon={Clock}        label="Active POs"     value={vendor.activeOrders}       color="text-blue-400" />
                <MetricBadge icon={TrendingDown} label="Delayed"        value={vendor.delayedOrders}     color="text-red-400" />
                <MetricBadge icon={XCircle}      label="Cancelled"      value={vendor.cancelledOrders}   color="text-slate-400" />
                <MetricBadge icon={IndianRupee}  label="Total Spend"
                  value={`₹${(vendor.totalSpend / 1000).toFixed(1)}k`}
                  color="text-primary-400"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/30 text-xs text-slate-500">
                <span>Lead Time: <span className="text-slate-300">{vendor.leadTimeDays} days</span></span>
                <span>Terms: <span className="text-slate-300">{vendor.paymentTerms}</span></span>
                {vendor.email && <span>{vendor.email}</span>}
                <span>On-time: <span className={vendor.onTimeOrders > 0 ? 'text-emerald-400' : 'text-slate-400'}>{vendor.onTimeOrders}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
