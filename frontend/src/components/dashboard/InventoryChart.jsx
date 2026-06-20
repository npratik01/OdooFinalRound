import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import LoadingSpinner from '../common/LoadingSpinner'

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#3b82f6', '#8b5cf6']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
        <p className="text-xs font-semibold text-slate-300 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export const StockStatusPieChart = ({ data, isLoading }) => {
  if (isLoading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>
  if (!data?.stockStatusBreakdown) return null

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-white text-sm mb-4">Stock Status Distribution</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data.stockStatusBreakdown}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.stockStatusBreakdown.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export const ProductTypeBarChart = ({ data, isLoading }) => {
  if (isLoading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>
  if (!data?.productTypeBreakdown) return null

  const chartData = data.productTypeBreakdown.map((item) => ({
    name: item.name.replace('_', ' '),
    Products: item.value,
  }))

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-white text-sm mb-4">Products by Type</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
          <Bar dataKey="Products" radius={[6, 6, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export const TopProductsChart = ({ data, isLoading }) => {
  if (isLoading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>
  if (!data?.topProducts?.length) return null

  const chartData = data.topProducts.slice(0, 8).map((p) => ({
    name: p.productName.length > 12 ? p.productName.substring(0, 12) + '...' : p.productName,
    'On Hand': p.onHandQty,
    'Free to Use': p.freeToUseQty,
  }))

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-white text-sm mb-4">Top Products by Stock</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
          <Legend formatter={(v) => <span className="text-xs text-slate-400">{v}</span>} />
          <Bar dataKey="On Hand" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Free to Use" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
