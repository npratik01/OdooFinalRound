import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react'
import { useState } from 'react'

const variantConfig = {
  success: { icon: CheckCircle, bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', iconColor: 'text-emerald-400' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-300', iconColor: 'text-amber-400' },
  error: { icon: XCircle, bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-300', iconColor: 'text-red-400' },
  info: { icon: Info, bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-300', iconColor: 'text-blue-400' },
}

const AlertBanner = ({ variant = 'info', title, message, dismissible = false, className = '' }) => {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const { icon: Icon, bg, text, iconColor } = variantConfig[variant]

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${bg} ${className}`}>
      <Icon className={`${iconColor} shrink-0 mt-0.5`} size={18} />
      <div className="flex-1 min-w-0">
        {title && <p className={`font-semibold text-sm ${text}`}>{title}</p>}
        {message && <p className={`text-sm ${text} opacity-80 mt-0.5`}>{message}</p>}
      </div>
      {dismissible && (
        <button onClick={() => setDismissed(true)} className={`${text} opacity-60 hover:opacity-100 shrink-0`}>
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export default AlertBanner
