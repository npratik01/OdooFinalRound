import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Factory, ClipboardList, Play, CheckCircle2, AlertTriangle,
  Wrench, TrendingUp, Package, Cpu, Clock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  fetchManufacturingDashboardSummary,
  fetchManufacturingAnalytics
} from '../../api/manufacturing.api'

const CHART_TOOLTIP = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' },
  labelStyle:   { color: '#94a3b8', fontSize: 12 },
}

const STATUS_COLORS = {
  'Draft':       '#64748b',
  'Confirmed':   '#3b82f6',
  'Ready':       '#8b5cf6',
  'In Progress': '#f59e0b',
  'Completed':   '#10b981',
  'Cancelled':   '#ef4444',
}

const KPICard = ({ icon: Icon, label, value, sub, color = 'text-violet-400', to }) => {
  const inner = (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-violet-500/30 transition-all cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-400">{label}</p>
        <div className={`w-9 h-9 rounded-xl bg-slate-900/60 flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

export default function ManufacturingDashboardPage() {
  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['manufacturing-summary'],
    queryFn:  () => fetchManufacturingDashboardSummary(),
    select:   r => r.data?.data?.summary,
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['manufacturing-analytics'],
    queryFn:  () => fetchManufacturingAnalytics(),
    select:   r => r.data?.data,
  })

  const trendData  = (analytics?.trend || []).map(t => ({ name: t.month, ...t }))
  const pieData    = (analytics?.statusDistribution || []).map(s => ({
    name: s.status, value: s.count, fill: STATUS_COLORS[s.status] || '#6366f1'
  }))
  const topProds   = (analytics?.topProducts || []).map(p => ({
    name: (p.productName || 'Unknown').slice(0, 14),
    qty:  p.totalQty,
  }))
  const wcData     = (analytics?.workCenterUtilization || []).slice(0, 5).map(w => ({
    name:  (w.workCenterName || 'Unknown').slice(0, 10),
    rate:  Math.round(w.completionRate || 0),
    total: w.totalWorkOrders,
  }))

  const eff = analytics?.productionEfficiency || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Factory size={24} className="text-violet-400" />
            Manufacturing Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time production metrics & analytics</p>
        </div>
        <div className="flex gap-3">
          <Link to="/manufacturing/new"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">
            + New MO
          </Link>
          <Link to="/bom/new"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-xl transition-colors">
            + New BoM
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {sumLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-slate-800/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard icon={ClipboardList} label="Total MOs"       value={summary?.totalMOs}        sub={`${summary?.draftMOs} drafts`}    color="text-slate-400"   to="/manufacturing" />
          <KPICard icon={Play}          label="In Progress"     value={summary?.inProgressMOs}   sub="Active production"                color="text-amber-400"   to="/manufacturing" />
          <KPICard icon={CheckCircle2}  label="Completed MOs"   value={summary?.completedMOs}    sub={`${summary?.completedToday} today`} color="text-emerald-400" to="/manufacturing" />
          <KPICard icon={AlertTriangle} label="Delayed MOs"     value={summary?.delayedMOs}      sub="Past planned date"                color="text-red-400"     to="/manufacturing" />
          <KPICard icon={Wrench}        label="Active WOs"      value={summary?.activeWorkOrders} sub="Pending + In Progress"           color="text-violet-400"  />
        </div>
      )}

      {/* Efficiency Strip */}
      {!analyticsLoading && eff.totalCompleted > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: 'Avg Efficiency',     value: `${eff.avgEfficiency}%`,   color: 'text-emerald-400' },
            { icon: Clock,      label: 'Avg Duration',       value: `${eff.avgDurationHours}h`, color: 'text-blue-400' },
            { icon: Package,    label: 'Total Produced',     value: eff.totalProduced,          color: 'text-violet-400' },
            { icon: Cpu,        label: 'Completion Rate',    value: `${eff.totalCompleted} MOs`, color: 'text-amber-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 flex items-center gap-3">
              <Icon size={16} className={color} />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Production Trend */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Monthly Production Trend</h2>
          {analyticsLoading ? <div className="h-56 bg-slate-700/30 rounded-xl animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip {...CHART_TOOLTIP} />
                <Line type="monotone" dataKey="total"     name="Total MOs"  stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} />
                <Line type="monotone" dataKey="completed" name="Completed"  stroke="#10b981" strokeWidth={2}   dot={{ fill: '#10b981', r: 3 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* MO Status Distribution */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">MO Status Distribution</h2>
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
        {/* Top Manufactured Products */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Top Manufactured Products</h2>
          {analyticsLoading ? <div className="h-56 bg-slate-700/30 rounded-xl animate-pulse" /> : topProds.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProds} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
                <Tooltip {...CHART_TOOLTIP} formatter={v => [v, 'Units Produced']} />
                <Bar dataKey="qty" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-500 text-sm">No completed MOs yet</div>
          )}
        </div>

        {/* Work Center Utilization */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Work Center Completion Rate</h2>
          {analyticsLoading ? <div className="h-56 bg-slate-700/30 rounded-xl animate-pulse" /> : wcData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={wcData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip {...CHART_TOOLTIP} formatter={v => [`${v}%`, 'Completion Rate']} />
                <Bar dataKey="rate" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-500 text-sm">No work orders yet</div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Manufacturing Orders', to: '/manufacturing',   icon: ClipboardList, color: 'from-violet-600/20 to-violet-600/5',  border: 'border-violet-500/20' },
          { label: 'Bill of Materials',    to: '/bom',             icon: Package,       color: 'from-blue-600/20 to-blue-600/5',      border: 'border-blue-500/20' },
          { label: 'Work Centers',         to: '/work-centers',    icon: Factory,       color: 'from-emerald-600/20 to-emerald-600/5', border: 'border-emerald-500/20' },
          { label: 'Operations',           to: '/operations',      icon: Cpu,           color: 'from-amber-600/20 to-amber-600/5',    border: 'border-amber-500/20' },
        ].map(({ label, to, icon: Icon, color, border }) => (
          <Link key={to} to={to}
            className={`bg-gradient-to-b ${color} border ${border} rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform`}>
            <Icon size={22} className="text-slate-300" />
            <span className="text-sm font-medium text-slate-300 text-center">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
