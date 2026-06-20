import { useSalesStats, useSalesAnalytics } from '../../hooks/useSales'
import { useCustomers } from '../../hooks/useCustomers'
import {
  TrendingUp, ShoppingCart, DollarSign, Truck,
  Clock, CheckCircle, Users, Package, BarChart2,
  AlertCircle, RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { Link } from 'react-router-dom'
import { buildRoute } from '../../constants/routes'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, color = 'primary', trend }) => {
  const colorMap = {
    primary: 'from-primary-500/20 to-indigo-600/10 border-primary-500/20 text-primary-400',
    emerald: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/20 text-emerald-400',
    amber:   'from-amber-500/20 to-orange-600/10 border-amber-500/20 text-amber-400',
    blue:    'from-blue-500/20 to-cyan-600/10 border-blue-500/20 text-blue-400',
    rose:    'from-rose-500/20 to-red-600/10 border-rose-500/20 text-rose-400',
  }
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
              {trend >= 0 ? '+' : ''}{trend}% this month
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="text-base font-bold text-white">{title}</h2>
    {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
  </div>
)

const statusColor = (status) => {
  if (status === 'Draft') return 'slate'
  if (status === 'Confirmed') return 'indigo'
  if (status === 'Partially Delivered') return 'amber'
  if (status === 'Fully Delivered') return 'emerald'
  if (status === 'Cancelled') return 'red'
  return 'slate'
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SalesAnalyticsPage = () => {
  const { data: stats, isLoading: isLoadingStats, error: statsError, refetch: refetchStats } = useSalesStats()
  const { data: analytics, isLoading: isLoadingAnalytics } = useSalesAnalytics()

  if (isLoadingStats || isLoadingAnalytics) return <LoadingSpinner />

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <AlertCircle size={40} className="text-rose-500" />
        <p className="text-slate-400 text-sm">Failed to load analytics data.</p>
        <button
          onClick={refetchStats}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Live performance metrics, trends, and order pipeline overview.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          Live data
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingCart}
          label="Total Sales Orders"
          value={stats?.totalOrders ?? 0}
          sub="All time"
          color="primary"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          sub="Delivered orders only"
          color="emerald"
        />
        <StatCard
          icon={Clock}
          label="Pending (Draft)"
          value={stats?.draftOrders ?? 0}
          sub="Awaiting confirmation"
          color="amber"
        />
        <StatCard
          icon={CheckCircle}
          label="Fully Delivered"
          value={stats?.deliveredOrders ?? 0}
          sub="Completed contracts"
          color="blue"
        />
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Confirmed Orders"
          value={stats?.confirmedOrders ?? 0}
          sub="Stock reserved"
          color="primary"
        />
        <StatCard
          icon={Truck}
          label="Partially Delivered"
          value={stats?.partialOrders ?? 0}
          sub="In-progress dispatches"
          color="amber"
        />
        <StatCard
          icon={AlertCircle}
          label="Cancelled Orders"
          value={stats?.cancelledOrders ?? 0}
          sub="Reservation released"
          color="rose"
        />
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <SectionHeader
            title="Monthly Revenue Trend"
            subtitle="Revenue from fully delivered orders in the last 6 months"
          />
          {analytics?.monthlyTrend?.length > 0 ? (
            <div className="space-y-3">
              {/* Simple bar chart using CSS */}
              {(() => {
                const maxVal = Math.max(...analytics.monthlyTrend.map(m => m.revenue || 0), 1)
                return analytics.monthlyTrend.map((month, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 w-20 shrink-0 text-right font-mono">
                      {month.month}/{month.year}
                    </span>
                    <div className="flex-1 bg-slate-800 rounded-full h-7 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 rounded-full flex items-center pl-3 transition-all duration-700"
                        style={{ width: `${Math.max(4, (month.revenue / maxVal) * 100)}%` }}
                      >
                        <span className="text-[10px] text-white font-semibold whitespace-nowrap">
                          {formatCurrency(month.revenue)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 w-10 shrink-0 text-right">
                      {month.count} SO
                    </span>
                  </div>
                ))
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart2 size={32} className="text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">No monthly data available yet.</p>
              <p className="text-xs text-slate-600 mt-1">Deliver some orders to start seeing trends.</p>
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <SectionHeader title="Order Pipeline" subtitle="Current status breakdown" />
          <div className="space-y-3">
            {[
              { label: 'Draft', value: stats?.draftOrders ?? 0, color: 'bg-slate-600' },
              { label: 'Confirmed', value: stats?.confirmedOrders ?? 0, color: 'bg-indigo-500' },
              { label: 'Partially Delivered', value: stats?.partialOrders ?? 0, color: 'bg-amber-500' },
              { label: 'Fully Delivered', value: stats?.deliveredOrders ?? 0, color: 'bg-emerald-500' },
              { label: 'Cancelled', value: stats?.cancelledOrders ?? 0, color: 'bg-rose-500' },
            ].map(({ label, value, color }) => {
              const total = stats?.totalOrders || 1
              const pct = Math.round((value / total) * 100)
              return (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="text-xs font-semibold text-slate-200">{value} <span className="text-slate-600">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${color}`}
                      style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Average order value */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Avg. Order Value</p>
            <p className="text-xl font-bold text-white">
              {stats?.totalOrders > 0
                ? formatCurrency((stats?.totalRevenue ?? 0) / (stats?.totalOrders ?? 1))
                : '—'
              }
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <SectionHeader
            title="Top Selling Products"
            subtitle="By total quantity delivered"
          />
          {analytics?.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {analytics.topProducts.slice(0, 8).map((product, idx) => (
                <div key={product._id} className="flex items-center gap-4 py-2.5 border-b border-slate-800/50 last:border-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{product.productName}</p>
                    <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{product.totalQty} <span className="text-xs text-slate-500">units</span></p>
                    <p className="text-xs text-emerald-400">{formatCurrency(product.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Package size={28} className="text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">No delivered products data yet.</p>
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <SectionHeader
            title="Top Customers"
            subtitle="By total order revenue"
          />
          {analytics?.topCustomers?.length > 0 ? (
            <div className="space-y-3">
              {analytics.topCustomers.slice(0, 8).map((customer, idx) => (
                <div key={customer._id} className="flex items-center gap-4 py-2.5 border-b border-slate-800/50 last:border-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={buildRoute.customerDetail(customer._id)}
                      className="text-sm font-semibold text-slate-200 hover:text-primary-400 truncate block transition-colors"
                    >
                      {customer.customerName}
                    </Link>
                    <p className="text-xs text-slate-500">{customer.totalOrders} orders</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{formatCurrency(customer.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users size={28} className="text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">No customer revenue data yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <SectionHeader
          title="Recent Sales Orders"
          subtitle="Latest 10 sales orders across all statuses"
        />
        {analytics?.recentOrders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  {['SO Number', 'Customer', 'Date', 'Items', 'Total Value', 'Status'].map((h) => (
                    <th key={h} className="pb-3 pr-6 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {analytics.recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-6">
                      <Link to={`/sales/${order._id}`} className="font-mono text-sm font-semibold text-primary-400 hover:underline">
                        {order.soNumber}
                      </Link>
                    </td>
                    <td className="py-3 pr-6">
                      <span className="text-sm text-slate-200">{order.customerId?.customerName || 'N/A'}</span>
                    </td>
                    <td className="py-3 pr-6">
                      <span className="text-xs text-slate-400">{formatDateTime(order.orderDate)}</span>
                    </td>
                    <td className="py-3 pr-6">
                      <span className="text-sm text-slate-400">{order.items?.length ?? 0} items</span>
                    </td>
                    <td className="py-3 pr-6">
                      <span className="text-sm font-semibold text-slate-200">{formatCurrency(order.totalAmount)}</span>
                    </td>
                    <td className="py-3">
                      <Badge color={statusColor(order.status)} size="sm">{order.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShoppingCart size={28} className="text-slate-700 mb-3" />
            <p className="text-sm text-slate-500">No orders created yet.</p>
            <Link to="/sales" className="text-primary-400 text-xs hover:underline mt-1">Create your first sales order →</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesAnalyticsPage
