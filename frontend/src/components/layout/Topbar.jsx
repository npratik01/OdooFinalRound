import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLowStockItems } from '../../hooks/useInventory'

const Topbar = ({ pageTitle }) => {
  const { user } = useAuth()
  const { data: lowStockData } = useLowStockItems()
  const lowStockCount = lowStockData?.meta?.total || 0

  return (
    <header className="h-16 bg-slate-900/50 border-b border-slate-800 px-6 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
      </div>
      <div className="flex items-center gap-3">
        {/* Low stock alert bell */}
        <div className="relative">
          <button className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Bell size={18} />
          </button>
          {lowStockCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {lowStockCount > 9 ? '9+' : lowStockCount}
            </span>
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
