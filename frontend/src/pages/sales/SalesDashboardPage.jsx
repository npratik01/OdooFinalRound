import { Link } from 'react-router-dom'
import { useSalesStats, useSalesAnalytics } from '../../hooks/useSales'
import { useCustomers } from '../../hooks/useCustomers'
import {
  ShoppingCart, DollarSign, Users, Truck, Clock,
  CheckCircle, AlertCircle, TrendingUp, ArrowRight,
  Package, BarChart2, Activity, RefreshCw
} from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { buildRoute } from '../../constants/routes'

// ─── Sub-components ──────────────────────────────────────────────────────────

const KPICard = ({ icon: Icon, label, value, sub, color = 'primary', href }) => {
  const colorMap = {
    primary: {
      grad: 'from-primary-600/20 to-indigo-600/10',
      border: 'border-primary-500/20',
      text: 'text-primary-400',
      icon: 'bg-primary-500/20',
    },
    emerald: {
      grad: 'from-emerald-600/20 to-teal-600/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      icon: 'bg-emerald-500/20',
    },
    amber: {
      grad: 'from-amber-600/20 to-orange-600/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      icon: 'bg-amber-500/20',
    },
    blue: {
      grad: 'from-blue-600/20 to-cyan-600/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      icon: 'bg-blue-500/20',
    },
    rose: {
      grad: 'from-rose-600/20 to-red-600/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      icon: 'bg-rose-500/20',
    },
  }
  const c = colorMap[color] || colorMap.primary

  const card = (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer group ${c.grad} ${c.border}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
          <Icon size={22} className={c.text} />
        </div>
      </div>
      {href && (
        <div className={`flex items-center gap-1 mt-4 text-xs font-semibold ${c.text} group-hover:gap-2 transition-all`}>
          View details <ArrowRight size={12} />
        </div>
      )}
    </div>
  )

  return href ? <Link to={href}>{card}</Link> : card
}

const statusColor = (status) => {
  if (status === 'Draft') return 'slate'
  if (status === 'Confirmed') return 'indigo'
  if (status === 'Partially Delivered') return 'amber'
  if (status === 'Fully Delivered') return 'emerald'
  if (status === 'Cancelled') return 'red'
  return 'slate'
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SalesDashboardPage = () => {
  const { data: stats, isLoading: isLoadingStats, error: statsError, refetch } = useSalesStats()
  const { data: analytics, isLoading: isLoadingAnalytics } = useSalesAnalytics()
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ isActive: true, limit: 1 })

  const isLoading = isLoadingStats || isLoadingAnalytics || isLoadingCustomers

  if (isLoading) return <LoadingSpinner />

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-12">
        <AlertCircle size={40} className="text-rose-500" />
        <p className="text-slate-400 text-sm">Failed to load dashboard data.</p>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  const totalCustomers = customersData?.meta?.total ?? 0
  const totalOrders = stats?.totalOrders ?? 0
  const totalRevenue = stats?.totalRevenue ?? 0
  const pendingDeliveries = (stats?.confirmedOrders ?? 0) + (stats?.partialOrders ?? 0)

  // Pipeline breakdown for chart
  const pipeline = [
    { label: 'Draft', value: stats?.draftOrders ?? 0, color: 'bg-slate-500', pct: 0 },
    { label: 'Confirmed', value: stats?.confirmedOrders ?? 0, color: 'bg-indigo-500', pct: 0 },
    { label: 'Partial', value: stats?.partialOrders ?? 0, color: 'bg-amber-500', pct: 0 },
    { label: 'Delivered', value: stats?.deliveredOrders ?? 0, color: 'bg-emerald-500', pct: 0 },
    { label: 'Cancelled', value: stats?.cancelledOrders ?? 0, color: 'bg-rose-500', pct: 0 },
  ].map((item) => ({
    ...item,
    pct: totalOrders > 0 ? Math.round((item.value / totalOrders) * 100) : 0,
  }))

  const recentOrders = analytics?.recentOrders?.slice(0, 5) || []
  const topProducts = analytics?.topProducts?.slice(0, 5) || []

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time overview of customers, orders, revenue, and delivery pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live data
          </div>
          <Link
            to="/sales-analytics"
            className="flex items-center gap-2 text-xs font-semibold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-3 py-2 rounded-xl hover:bg-primary-500/20 transition-colors"
          >
            <BarChart2 size={13} /> Full Analytics
          </Link>
        </div>
      </div>

      {/* ── KPI Cards Row 1 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={ShoppingCart}
          label="Total Orders"
          value={totalOrders}
          sub="All time"
          color="primary"
          href="/sales"
        />
        <KPICard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          sub="Delivered orders"
          color="emerald"
        />
        <KPICard
          icon={Truck}
          label="Pending Deliveries"
          value={pendingDeliveries}
          sub="Confirmed + partial"
          color="amber"
          href="/sales"
        />
        <KPICard
          icon={Users}
          label="Active Customers"
          value={totalCustomers}
          sub="All registered"
          color="blue"
          href="/customers"
        />
      </div>

      {/* ── KPI Cards Row 2 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          icon={CheckCircle}
          label="Fully Delivered"
          value={stats?.deliveredOrders ?? 0}
          sub="Completed contracts"
          color="emerald"
        />
        <KPICard
          icon={Clock}
          label="Draft Orders"
          value={stats?.draftOrders ?? 0}
          sub="Awaiting confirmation"
          color="amber"
        />
        <KPICard
          icon={AlertCircle}
          label="Cancelled"
          value={stats?.cancelledOrders ?? 0}
          sub="Stock released"
          color="rose"
        />
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-white">Monthly Revenue Trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 6 months of delivered orders</p>
            </div>
            <TrendingUp size={16} className="text-primary-400" />
          </div>

          {analytics?.monthlyTrend?.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const maxVal = Math.max(...analytics.monthlyTrend.map((m) => m.revenue || 0), 1)
                return analytics.monthlyTrend.map((month, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 w-16 shrink-0 text-right font-mono">
                      {month.month}/{month.year}
                    </span>
                    <div className="flex-1 bg-slate-800 rounded-full h-8 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 rounded-full flex items-center pl-3 transition-all duration-700"
                        style={{ width: `${Math.max(5, (month.revenue / maxVal) * 100)}%` }}
                      >
                        <span className="text-[10px] text-white font-semibold whitespace-nowrap">
                          {formatCurrency(month.revenue)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 w-12 shrink-0 text-right">
                      {month.count} SO
                    </span>
                  </div>
                ))
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart2 size={32} className="text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">No monthly data yet.</p>
              <p className="text-xs text-slate-600 mt-1">Complete some deliveries to see trends.</p>
            </div>
          )}
        </div>

        {/* Order Pipeline Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-white">Order Pipeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">Status distribution</p>
            </div>
            <Activity size={16} className="text-slate-500" />
          </div>

          <div className="space-y-3">
            {pipeline.map(({ label, value, color, pct }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {value} <span className="text-slate-600">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Avg. Order Value</p>
            <p className="text-2xl font-bold text-white">
              {totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Recent Orders</h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest 5 sales orders</p>
            </div>
            <Link
              to="/sales"
              className="text-xs text-primary-400 font-semibold hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Link
                  key={order._id}
                  to={buildRoute.salesDetail(order._id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary-400">{order.soNumber}</span>
                      <Badge color={statusColor(order.status)} size="sm">{order.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {order.customerId?.customerName || 'N/A'} · {formatDateTime(order.orderDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold text-white">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShoppingCart size={28} className="text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">No orders yet.</p>
              <Link to="/sales" className="text-primary-400 text-xs hover:underline mt-1 flex items-center gap-1">
                Create your first order <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Top Selling Products</h2>
              <p className="text-xs text-slate-500 mt-0.5">By delivered quantity</p>
            </div>
            <Package size={16} className="text-slate-500" />
          </div>

          {topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.map((product, idx) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40"
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
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
              <p className="text-sm text-slate-500">No delivered products yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions Footer ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/customers"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 font-medium transition-colors"
          >
            <Users size={14} /> Manage Customers
          </Link>
          <Link
            to="/sales"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 font-medium transition-colors"
          >
            <ShoppingCart size={14} /> View Sales Orders
          </Link>
          <Link
            to="/sales-analytics"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 font-medium transition-colors"
          >
            <TrendingUp size={14} /> Deep Analytics
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SalesDashboardPage
