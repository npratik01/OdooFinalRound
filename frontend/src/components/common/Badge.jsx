const variantMap = {
  normal: 'badge-normal',
  low_stock: 'badge-low-stock',
  LOW_STOCK: 'badge-low-stock',
  NORMAL: 'badge-normal',
  active: 'badge-normal',
  inactive: 'badge-inactive',
  success: 'badge-normal',
  warning: 'badge-low-stock',
  danger: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20',
  info: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20',
  purple: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20',
}

const Badge = ({ children, variant = 'info', className = '' }) => {
  const cls = variantMap[variant] || variantMap.info
  return (
    <span className={`${cls} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
