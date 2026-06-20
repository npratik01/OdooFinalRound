import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Trash2, CheckSquare, RefreshCw, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLowStockItems } from '../../hooks/useInventory'
import { notificationApi } from '../../api/notification.api'
import { formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

const TYPE_CONFIG = {
  INFO:    { icon: Info, textClass: 'text-blue-400', bgClass: 'bg-blue-500/10 border-blue-500/20' },
  WARNING: { icon: AlertTriangle, textClass: 'text-amber-400', bgClass: 'bg-amber-500/10 border-amber-500/20' },
  SUCCESS: { icon: CheckCircle, textClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/20' },
  ERROR:   { icon: AlertCircle, textClass: 'text-red-400', bgClass: 'bg-red-500/10 border-red-500/20' },
}

const Topbar = ({ pageTitle }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // 1. Fetch unread notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationApi.getNotifications({ limit: 10, isRead: 'false' }).then(r => r.data?.data),
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
    enabled: !!user,
  })

  // 2. Fetch low stock alert count
  const { data: lowStockData } = useLowStockItems()
  const lowStockCount = lowStockData?.meta?.total || 0

  const notifications = notifData?.notifications || []
  const unreadCount = notifData?.meta?.total || 0

  // 3. Mark single notification as read mutation
  const readMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => toast.error('Failed to update notification'),
  })

  // 4. Mark all notifications as read mutation
  const readAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    },
    onError: () => toast.error('Failed to update notifications'),
  })

  // Click outside to close handler
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <header className="h-16 bg-slate-900/50 border-b border-slate-800 px-6 flex items-center justify-between backdrop-blur-sm sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Interactive Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors relative
              ${isOpen ? 'bg-slate-800 text-slate-100' : ''}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            )}
          </button>

          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-primary-600 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none">
              {unreadCount}
            </span>
          )}

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => readAllMutation.mutate()}
                    className="text-[10px] text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <CheckSquare size={12} /> Read All
                  </button>
                )}
              </div>

              {/* Feed */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-850">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-500">
                    <p>No new notifications</p>
                    <p className="mt-1 opacity-50">You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO
                    const Icon = cfg.icon
                    return (
                      <div 
                        key={notif._id} 
                        className="p-3 hover:bg-slate-850/40 flex items-start gap-2.5 transition-colors group"
                      >
                        <div className={`w-7 h-7 rounded-lg ${cfg.bgClass} flex items-center justify-center shrink-0 border mt-0.5`}>
                          <Icon className={cfg.textClass} size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white leading-tight">{notif.title}</p>
                          <p className="text-[11px] text-slate-300 mt-1 leading-snug">{notif.message}</p>
                          <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                            {formatDateTime(notif.createdAt)}
                          </span>
                        </div>
                        <button 
                          onClick={() => readMutation.mutate(notif._id)}
                          className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5"
                          title="Mark read"
                        >
                          <Check size={11} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-slate-800 text-center bg-slate-950/20">
                <span className="text-[10px] text-slate-500">
                  {lowStockCount > 0 
                    ? `⚠️ ${lowStockCount} items currently under minimum stock` 
                    : '✅ Inventory stock levels are healthy'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-700" />

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-slate-300 hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  )
}

export default Topbar
