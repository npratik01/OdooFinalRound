import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  Building2, ShoppingCart, PackageCheck, AlertCircle,
  CheckCircle, XCircle, TrendingUp, IndianRupee, Package, AlertTriangle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { procurementApi } from '../../api/procurement.api'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const COLORS  = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#7c3aed','#4f46e5']
const PIE_COLORS = {
  'Draft':              '#64748b',
  'Confirmed':          '#3b82f6',
  'Partially Received': '#f59e0b',
  'Fully Received':     '#10b981',
  'Cancelled':          '#ef4444',
}

const KPICard = ({ icon: Icon, label, value, sub, color = 'text-primary-400' }) => (
  <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-primary-500/30 transition-all">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-slate-400">{label}</p>
      <div className={`w-9 h-9 rounded-xl bg-slate-900/60 flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
)

const CHART_TOOLTIP = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' },
  labelStyle:   { color: '#94a3b8', fontSize: 12 },
}

export default function ProcurementDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['procurement-stats'],
    queryFn:  () => procurementApi.getDashboard(),
    select:   r => r.data?.data,
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['procurement-analytics'],
    queryFn:  () => procurementApi.getAnalytics(),
    select:   r => r.data?.data,
  })

  const { data: insights } = useQuery({
    queryKey: ['low-stock-insights'],
    queryFn:  () => procurementApi.getLowStockInsights(),
    select:   r => r.data?.data,
  })

  const monthlyData = (analytics?.monthlyTrend || []).map(t => ({
    name:   `${MONTHS[t.month - 1]} ${t.year}`,
    amount: t.totalAmount,
    orders: t.count,
  }))

  const vendorData = (analytics?.vendorWisePurchases || []).map(v => ({
    name:   v.vendorName.length > 14 ? v.vendorName.slice(0, 14) + '…' : v.vendorName,
    amount: v.totalAmount,
    orders: v.totalOrders,
  }))

  const pieData = (analytics?.statusDistribution || []).map(s => ({
    name:  s.status,
    value: s.count,
    fill:  PIE_COLORS[s.status] || '#6366f1',
  }))

  const topProducts = (analytics?.topProducts || []).map(p => ({
    name: p.productName.length > 16 ? p.productName.slice(0, 16) + '…' : p.productName,
    qty:  p.totalReceived,
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Procurement Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time procurement metrics & analytics</p>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-slate-800/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard icon={Building2}    label="Total Vendors"     value={stats?.totalVendors}    sub={`${stats?.activeVendors} active`} color="text-violet-400" />
          <KPICard icon={ShoppingCart} label="Total POs"         value={stats?.totalPOs}        sub={`${stats?.draftPOs} drafts`}  color="text-blue-400" />
          <KPICard icon={AlertCircle}  label="Pending Receipts"  value={stats?.pendingReceipts} sub="Confirmed + Partial"           color="text-amber-400" />
          <KPICard icon={PackageCheck} label="Partial Received"  value={stats?.partialPOs}      sub="In progress"                  color="text-orange-400" />
          <KPICard icon={CheckCircle}  label="Completed POs"     value={stats?.completedPOs}    sub="Fully received"               color="text-emerald-400" />
          <KPICard icon={IndianRupee}  label="Total Spend"       value={`₹${(stats?.totalSpend || 0).toLocaleString()}`} sub="Active POs" color="text-primary-400" />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Purchase Trend */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Monthly Purchase Trend</h2>
          {analyticsLoading ? <div className="h-56 bg-slate-700/30 rounded-xl animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip {...CHART_TOOLTIP} formatter={v => [`₹${v.toLocaleString()}`, 'Amount']} />
                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* PO Status Distribution */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">PO Status Distribution</h2>
          {analyticsLoading ? <div className="h-56 bg-slate-700/30 rounded-xl animate-pulse" /> : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.fill }} />
                    <p className="text-xs text-slate-400 flex-1">{entry.name}</p>
                    <span className="text-sm font-semibold text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor-wise Purchases */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Top Vendors by Purchase Amount</h2>
          {analyticsLoading ? <div className="h-56 bg-slate-700/30 rounded-xl animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vendorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
                <Tooltip {...CHART_TOOLTIP} formatter={v => [`₹${v.toLocaleString()}`, 'Amount']} />
                <Bar dataKey="amount" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products Purchased */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Top Purchased Products</h2>
          {analyticsLoading ? <div className="h-56 bg-slate-700/30 rounded-xl animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                <Tooltip {...CHART_TOOLTIP} formatter={v => [v, 'Units Received']} />
                <Bar dataKey="qty" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Low Stock Replenishment Insights */}
      {insights && insights.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <h2 className="font-semibold text-white">Low Stock — Replenishment Insights</h2>
            </div>
            <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-1 rounded-full">{insights.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Product</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">On Hand</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Min Level</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Suggested Order</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Recommended Vendor</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {insights.map((ins, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-white">{ins.product?.productName}</p>
                      <p className="text-xs text-slate-500">{ins.product?.sku}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-semibold text-red-400">{ins.onHandQty}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-400">{ins.minimumStockLevel}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold text-amber-400">{ins.suggestedPurchaseQty}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {ins.recommendedVendor ? (
                        <div>
                          <p className="text-sm text-white">{ins.recommendedVendor.vendorName}</p>
                          <p className="text-xs text-slate-500">{ins.lastPONumber}</p>
                        </div>
                      ) : <span className="text-slate-500 text-sm">No history</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link to="/purchase-orders/new" className="text-xs text-primary-400 hover:text-primary-300 font-medium">Create PO →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {analytics?.recentOrders?.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50">
            <h2 className="font-semibold text-white">Recent Purchase Orders</h2>
            <Link to="/purchase-orders" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>
          </div>
          <div className="divide-y divide-slate-700/20">
            {analytics.recentOrders.slice(0, 5).map(po => (
              <Link key={po._id} to={`/purchase-orders/${po._id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/50 transition-colors">
                <div>
                  <span className="text-sm font-mono font-semibold text-primary-400">{po.poNumber}</span>
                  <span className="text-xs text-slate-400 ml-3">{po.vendorId?.vendorName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">₹{po.totalAmount?.toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    po.status === 'Fully Received' ? 'bg-emerald-500/15 text-emerald-400' :
                    po.status === 'Confirmed' ? 'bg-blue-500/15 text-blue-400' :
                    po.status === 'Partially Received' ? 'bg-amber-500/15 text-amber-400' :
                    po.status === 'Cancelled' ? 'bg-red-500/15 text-red-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>{po.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
