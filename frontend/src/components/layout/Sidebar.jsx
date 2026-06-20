import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Warehouse, Users,
  ChevronRight, Activity, LogOut, FileText,
  ArrowLeftRight, UserCheck, TrendingUp, Truck, BarChart2,
  Building2, ShoppingCart, BarChart3, Award,
  Factory, Cpu, Wrench, AreaChart
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

// ─── Nav configuration with role-based visibility ────────────────────────────
const navItems = [
  // ── Core ──────────────────────────────────────────────────────────────────
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    // All roles see Dashboard
  },
  {
    to: '/products',
    label: 'Products',
    icon: Package,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER],
  },
  {
    to: '/inventory',
    label: 'Inventory',
    icon: Warehouse,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.INVENTORY_MANAGER, ROLES.PURCHASE_USER],
  },
  {
    to: '/inventory/movements',
    label: 'Stock Movements',
    icon: ArrowLeftRight,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.INVENTORY_MANAGER],
  },
  // ── Sales ─────────────────────────────────────────────────────────────────
  {
    to: '/customers',
    label: 'Customers',
    icon: UserCheck,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER],
  },
  {
    to: '/sales',
    label: 'Sales Orders',
    icon: FileText,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER],
  },
  {
    to: '/sales-dashboard',
    label: 'Sales Dashboard',
    icon: Truck,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER],
  },
  {
    to: '/sales-analytics',
    label: 'Sales Analytics',
    icon: BarChart2,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER],
  },
  // ── Procurement (Phase 3) ─────────────────────────────────────────────────
  {
    to: '/vendors',
    label: 'Vendors',
    icon: Building2,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER, ROLES.MANUFACTURING_USER],
  },
  {
    to: '/purchase-orders',
    label: 'Purchase Orders',
    icon: ShoppingCart,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER, ROLES.MANUFACTURING_USER],
  },
  {
    to: '/procurement-dashboard',
    label: 'Procurement',
    icon: BarChart3,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER, ROLES.INVENTORY_MANAGER],
  },
  {
    to: '/supplier-performance',
    label: 'Supplier Performance',
    icon: Award,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER],
  },
  // ── Manufacturing (Phase 4) ───────────────────────────────────────────────
  {
    to: '/manufacturing',
    label: 'Mfg Orders',
    icon: Factory,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER],
  },
  {
    to: '/bom',
    label: 'Bill of Materials',
    icon: Cpu,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER],
  },
  {
    to: '/work-centers',
    label: 'Work Centers',
    icon: Wrench,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER],
  },
  {
    to: '/manufacturing-dashboard',
    label: 'Mfg Dashboard',
    icon: AreaChart,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER],
  },
  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    to: '/users',
    label: 'Users',
    icon: Users,
    roles: [ROLES.ADMIN],
  },
]

const Sidebar = () => {
  const { user, logout, hasRole } = useAuth()

  const visibleItems = navItems.filter(
    (item) => !item.roles || hasRole(item.roles)
  )

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">Mini ERP</h1>
            <p className="text-xs text-slate-500 leading-tight">Phase 4 — Manufacturing</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/inventory'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-sm shadow-primary-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'}
                />
                <span className="flex-1 truncate">{label}</span>
                {isActive && <ChevronRight size={13} className="text-primary-400 shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Role Badge + User section */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1.5">
        {/* Role indicator */}
        <div className="px-3 py-1.5 rounded-lg bg-slate-800/50">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Signed in as</p>
          <span className="inline-flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-primary-400">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            {user?.role?.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
