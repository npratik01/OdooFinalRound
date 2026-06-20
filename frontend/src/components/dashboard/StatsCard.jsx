const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'primary', trend }) => {
  const colorMap = {
    primary: {
      bg: 'from-primary-600/20 to-primary-800/10',
      iconBg: 'bg-primary-500/20',
      iconColor: 'text-primary-400',
      border: 'border-primary-500/20',
      valueColor: 'text-white',
    },
    amber: {
      bg: 'from-amber-600/20 to-amber-800/10',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      border: 'border-amber-500/20',
      valueColor: 'text-amber-400',
    },
    emerald: {
      bg: 'from-emerald-600/20 to-emerald-800/10',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      border: 'border-emerald-500/20',
      valueColor: 'text-emerald-400',
    },
    blue: {
      bg: 'from-blue-600/20 to-blue-800/10',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      border: 'border-blue-500/20',
      valueColor: 'text-blue-400',
    },
    red: {
      bg: 'from-red-600/20 to-red-800/10',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      border: 'border-red-500/20',
      valueColor: 'text-red-400',
    },
  }

  const c = colorMap[color] || colorMap.primary

  return (
    <div className={`card-hover p-5 bg-gradient-to-br ${c.bg} border ${c.border} rounded-xl animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
          <p className={`text-3xl font-bold ${c.valueColor}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0 ml-4`}>
          <Icon className={c.iconColor} size={22} />
        </div>
      </div>
    </div>
  )
}

export default StatsCard
