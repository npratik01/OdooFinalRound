import { useSalesStats, useSalesAnalytics } from '../../hooks/useSales'
import StatsCard from './StatsCard'
import {
  FileText, DollarSign, Users, Truck, ShoppingBag, Clock
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import LoadingSpinner from '../common/LoadingSpinner'

const STATUS_COLORS = {
  Draft: '#94a3b8',
  Confirmed: '#6366f1',
  'Partially Delivered': '#f59e0b',
  'Fully Delivered': '#10b981',
  Cancelled: '#ef4444'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
        <p className="text-xs font-semibold text-slate-300 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name}: {p.name === 'Revenue' ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const SalesAnalyticsTab = () => {
  const { data: stats, isLoading: statsLoading } = useSalesStats()
  const { data: analytics, isLoading: analyticsLoading } = useSalesAnalytics()

  if (statsLoading || analyticsLoading) return <LoadingSpinner />

  // Convert status counts to array format for Recharts Pie
  const statusPieData = stats?.statusCounts
    ? Object.entries(stats.statusCounts)
        .map(([key, val]) => ({ name: key, value: val, color: STATUS_COLORS[key] }))
        .filter(item => item.value > 0)
    : []

  // Pending deliveries are orders that are Confirmed or Partially Delivered
  const pendingDeliveries = (stats?.statusCounts?.Confirmed || 0) + (stats?.statusCounts?.['Partially Delivered'] || 0)

  return (
    <div className="space-y-6">
      {/* Sales KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Sales Orders"
          value={stats?.totalOrdersCount ?? 0}
          subtitle={`${stats?.statusCounts?.Draft ?? 0} draft, ${stats?.statusCounts?.Cancelled ?? 0} cancelled`}
          icon={FileText}
          color="primary"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalSalesRevenue ?? 0)}
          subtitle="Confirmed & shipped orders"
          icon={DollarSign}
          color="emerald"
        />
        <StatsCard
          title="Active Customers"
          value={stats?.activeCustomerCount ?? 0}
          subtitle="With profile records"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Pending Shipments"
          value={pendingDeliveries}
          subtitle="Awaiting dispatch"
          icon={Truck}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <ShoppingBag className="text-emerald-400" size={16} />
            </div>
            <h3 className="font-semibold text-white text-sm">Monthly Sales Trend</h3>
          </div>
          {analytics?.salesTrend?.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No sales data logged in past 6 months</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics?.salesTrend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fillOpacity={1} fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="lg:col-span-1 card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Clock className="text-indigo-400" size={16} />
            </div>
            <h3 className="font-semibold text-white text-sm">Order Status Breakdown</h3>
          </div>
          {statusPieData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No orders registered</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span className="text-xs text-slate-400">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Rankings Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
            <h3 className="font-semibold text-white text-sm">Top Customers</h3>
            <span className="ml-auto text-xs text-slate-500">By sales value</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th className="text-center">Orders</th>
                  <th className="text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.topCustomers?.map((c) => (
                  <tr key={c._id} className="border-t border-slate-700/50">
                    <td>
                      <div>
                        <p className="font-medium text-white text-sm">{c.customerName}</p>
                        <span className="font-mono text-xs text-primary-400">{c.customerCode}</span>
                      </div>
                    </td>
                    <td className="text-center text-slate-300 font-medium">{c.orderCount}</td>
                    <td className="text-right text-emerald-400 font-semibold">{formatCurrency(c.totalSpent)}</td>
                  </tr>
                ))}
                {!analytics?.topCustomers?.length && (
                  <tr><td colSpan={3} className="text-center py-8 text-slate-500">No customer transactions logged</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
            <h3 className="font-semibold text-white text-sm">Top Selling Products</h3>
            <span className="ml-auto text-xs text-slate-500">By units sold</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-center">Units Sold</th>
                  <th className="text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.topProducts?.map((p) => (
                  <tr key={p._id} className="border-t border-slate-700/50">
                    <td>
                      <div>
                        <p className="font-medium text-white text-sm">{p.productName}</p>
                        <span className="font-mono text-xs text-primary-400">{p.sku}</span>
                      </div>
                    </td>
                    <td className="text-center text-slate-300 font-medium">{p.totalQty}</td>
                    <td className="text-right text-emerald-400 font-semibold">{formatCurrency(p.totalRevenue)}</td>
                  </tr>
                ))}
                {!analytics?.topProducts?.length && (
                  <tr><td colSpan={3} className="text-center py-8 text-slate-500">No product sales logged</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesAnalyticsTab
