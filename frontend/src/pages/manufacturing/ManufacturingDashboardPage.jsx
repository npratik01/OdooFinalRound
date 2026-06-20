import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Factory,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Package,
  Wrench,
  Clock
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { manufacturingApi } from '../../api/manufacturing.api'
import StatsCard from '../../components/dashboard/StatsCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const STATUS_COLORS = {
  DRAFT:       '#475569',
  CONFIRMED:   '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  DONE:        '#10b981',
  CANCELLED:   '#ef4444',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
        {label !== undefined && <p className="font-semibold text-slate-300 mb-1">Week {label}</p>}
        {payload.map((p, i) => (
          <p key={i} className="font-bold" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ManufacturingDashboardPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['manufacturing-dashboard'],
    queryFn:  () => manufacturingApi.getDashboardStats().then(r => r.data?.data),
    refetchInterval: 1000 * 60 * 5, // refetch every 5 minutes
  })

  if (isLoading) return <div className="p-6 flex justify-center items-center h-96"><LoadingSpinner /></div>
  if (isError || !stats) return <div className="p-6 text-center text-red-400">Failed to load manufacturing dashboard stats</div>

  const summary = stats.summary || {}
  const byStatus = summary.byStatus || {}
  const activeMOs = stats.activeMOs || []
  const topProducts = stats.topProducts || []
  const weeklyTrend = stats.weeklyTrend || []

  // Format Status Data for Pie Chart
  const pieData = Object.keys(byStatus).map(key => ({
    name: key,
    value: byStatus[key],
    color: STATUS_COLORS[key] || '#94a3b8'
  })).filter(item => item.value > 0)

  // Format Weekly Trend for Chart
  const trendData = weeklyTrend.map(item => ({
    name: item._id?.week !== undefined ? `${item._id.week}` : '—',
    'Produced Qty': item.totalProduced || 0,
    'MOs Completed': item.ordersCompleted || 0
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manufacturing Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time production metrics and throughput</p>
        </div>
        <Link
          to="/manufacturing/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
        >
          New MO <ArrowUpRight size={16} />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Production Orders"
          value={summary.totalMOs ?? 0}
          subtitle={`Active: ${byStatus.IN_PROGRESS ?? 0} · Confirmed: ${byStatus.CONFIRMED ?? 0}`}
          icon={Factory}
          color="primary"
        />
        <StatsCard
          title="Completed Orders"
          value={summary.thisMonthCompleted ?? 0}
          subtitle="During this current month"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Monthly Output Units"
          value={summary.thisMonthProduced ?? 0}
          subtitle={`Last Month: ${summary.prevMonthProduced ?? 0} units`}
          icon={TrendingUp}
          color={summary.outputGrowth >= 0 ? 'emerald' : 'red'}
        />
        <StatsCard
          title="Production Efficiency"
          value={`${summary.outputGrowth >= 0 ? '+' : ''}${summary.outputGrowth ?? 0}%`}
          subtitle="Monthly output volume delta"
          icon={Activity}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly output trend */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Weekly Production Volume (Last 8 Weeks)</h3>
          {trendData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-slate-500 text-sm">
              <Clock size={32} className="opacity-20 mb-2" />
              <p>No historical completed production data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
                <Legend formatter={(v) => <span className="text-xs text-slate-400">{v}</span>} />
                <Bar dataKey="Produced Qty" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MOs Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Order Status Breakdown</h3>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-slate-500 text-sm">
              <Activity size={32} className="opacity-20 mb-2" />
              <p>No active orders in system</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-400 font-semibold">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Production Floor (IN_PROGRESS) */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Active Floor Production</h3>
            <span className="text-xs text-slate-500 font-semibold">{activeMOs.length} order(s) running</span>
          </div>

          <div className="divide-y divide-slate-700/30">
            {activeMOs.length === 0 ? (
              <p className="text-center py-12 text-slate-500 text-sm">No production orders currently in progress</p>
            ) : (
              activeMOs.map(mo => (
                <div key={mo._id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30 transition-all rounded-lg p-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to={`/manufacturing/${mo._id}`} className="text-sm font-mono font-bold text-primary-400 hover:underline">
                        {mo.moNumber}
                      </Link>
                      <span className="text-xs text-slate-500">[{mo.workCenterId?.name || 'No WC'}]</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{mo.productId?.productName}</p>
                  </div>
                  <div className="w-full md:w-36 text-right">
                    <p className="text-xs text-slate-400 font-semibold">
                      {mo.producedQty} / {mo.plannedQty} units
                    </p>
                    <div className="w-full bg-slate-750 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${mo.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Manufactured Products */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-white text-sm">Top Produced Products (All-Time)</h3>
          <div className="divide-y divide-slate-700/30">
            {topProducts.length === 0 ? (
              <p className="text-center py-12 text-slate-500 text-sm">No completed production logged yet</p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={p._id} className="py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-400">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{p.productName || '—'}</p>
                      <span className="text-xs text-slate-500 font-mono">{p.sku}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{p.totalProduced} unit(s)</p>
                    <p className="text-xs text-slate-500">{p.moCount} order(s)</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
