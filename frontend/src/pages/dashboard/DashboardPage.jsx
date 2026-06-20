import { useQuery } from '@tanstack/react-query'
import { Package, Warehouse, AlertTriangle, DollarSign, Clock, TrendingDown, ArrowUpRight, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi } from '../../api/dashboard.api'
import { useLowStockItems } from '../../hooks/useInventory'
import StatsCard from '../../components/dashboard/StatsCard'
import LowStockAlert from '../../components/dashboard/LowStockAlert'
import { StockStatusPieChart, ProductTypeBarChart, TopProductsChart } from '../../components/dashboard/InventoryChart'
import { formatCurrency, formatDate, enumToLabel } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import { buildRoute } from '../../constants/routes'
import { useState } from 'react'
import SalesAnalyticsTab from '../../components/dashboard/SalesAnalyticsTab'

// ─── Dashboard Tables ──────────────────────────────────────────────────────────

const RecentProductsTable = ({ data, isLoading }) => {
  const navigate = useNavigate()
  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>

  return (
    <div className="card">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
          <Clock className="text-primary-400" size={16} />
        </div>
        <h3 className="font-semibold text-white text-sm">Recent Products</h3>
        <span className="ml-auto text-xs text-slate-500">Last 10 added</span>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Cost Price</th>
              <th>Stock</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((p) => (
              <tr
                key={p._id}
                className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer"
                onClick={() => navigate(buildRoute.productDetail(p._id))}
              >
                <td>
                  <div>
                    <p className="font-medium text-white text-sm">{p.productName}</p>
                    <span className="font-mono text-xs text-primary-400">{p.sku}</span>
                  </div>
                </td>
                <td>
                  {(() => {
                    const colors = { FINISHED_GOOD: 'info', RAW_MATERIAL: 'purple', COMPONENT: 'warning' }
                    return <Badge variant={colors[p.productType] || 'info'}>{enumToLabel(p.productType)}</Badge>
                  })()}
                </td>
                <td className="text-slate-300">{formatCurrency(p.costPrice)}</td>
                <td>
                  {p.inventory ? (
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{p.inventory.onHandQty}</span>
                      <Badge variant={p.inventory.stockStatus}>{p.inventory.stockStatus?.replace('_', ' ')}</Badge>
                    </div>
                  ) : '—'}
                </td>
                <td className="text-slate-400 text-xs">{formatDate(p.createdAt)}</td>
              </tr>
            ))}
            {!data?.length && (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const LowStockProductsTable = ({ data, isLoading }) => {
  const navigate = useNavigate()
  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>
  if (!data?.length) return null

  return (
    <div className="card">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <TrendingDown className="text-amber-400" size={16} />
        </div>
        <h3 className="font-semibold text-white text-sm">Low Stock Products</h3>
        <span className="ml-auto">
          <Badge variant="warning">{data.length} items need restocking</Badge>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>On Hand</th>
              <th>Min Level</th>
              <th>Deficit</th>
              <th>Free to Use</th>
              <th>Cost Price</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item._id}
                className="border-t border-slate-700/50 hover:bg-amber-500/5 transition-colors cursor-pointer"
                onClick={() => navigate(buildRoute.productDetail(item.productId))}
              >
                <td>
                  <div>
                    <p className="font-medium text-white text-sm">{item.productName}</p>
                    <span className="font-mono text-xs text-primary-400">{item.sku}</span>
                  </div>
                </td>
                <td><span className="font-bold text-amber-400">{item.onHandQty}</span></td>
                <td><span className="text-slate-400">{item.minimumStockLevel}</span></td>
                <td>
                  <span className="font-bold text-red-400">-{item.deficit}</span>
                </td>
                <td><span className="text-emerald-400">{item.freeToUseQty}</span></td>
                <td className="text-slate-300">{formatCurrency(item.costPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('inventory')
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data.data),
    refetchInterval: 1000 * 60 * 5,
  })

  const { data: inventoryStatusData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard', 'inventory-status'],
    queryFn: () => dashboardApi.getInventoryStatus().then((r) => r.data.data),
  })

  const { data: recentProductsData, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard', 'recent-products'],
    queryFn: () => dashboardApi.getRecentProducts().then((r) => r.data.data),
  })

  const { data: lowStockTableData, isLoading: lowStockTableLoading } = useQuery({
    queryKey: ['dashboard', 'low-stock-products'],
    queryFn: () => dashboardApi.getLowStockProducts().then((r) => r.data.data),
    refetchInterval: 1000 * 60 * 2,
  })

  const { data: lowStockData, isLoading: lowStockLoading } = useLowStockItems()

  const stats = statsData || {}

  return (
    <div className="space-y-6">
      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'inventory' ? 'border-primary-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory Analytics
        </button>
        <button
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'sales' ? 'border-primary-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('sales')}
        >
          Sales Analytics
        </button>
      </div>

      {activeTab === 'sales' ? (
        <SalesAnalyticsTab />
      ) : (
        <>
          {/* KPI Cards — exactly 4 as specified */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatsCard
              title="Total Products"
              value={statsLoading ? '—' : (stats.activeProducts ?? 0)}
              subtitle={`${stats.inactiveProducts ?? 0} inactive`}
              icon={Package}
              color="primary"
            />
            <StatsCard
              title="Total Inventory Records"
              value={statsLoading ? '—' : (stats.totalInventoryRecords ?? 0)}
              subtitle="Tracked items"
              icon={Warehouse}
              color="blue"
            />
            <StatsCard
              title="Low Stock Products"
              value={statsLoading ? '—' : (stats.lowStockCount ?? 0)}
              subtitle="Below minimum threshold"
              icon={AlertTriangle}
              color={stats.lowStockCount > 0 ? 'amber' : 'emerald'}
            />
            <StatsCard
              title="Total Inventory Value"
              value={statsLoading ? '—' : formatCurrency(stats.totalInventoryValue ?? 0)}
              subtitle={`Sales value: ${formatCurrency(stats.totalSalesValue ?? 0)}`}
              icon={DollarSign}
              color="emerald"
            />
          </div>

          {/* Charts Row + Low Stock Alert Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StockStatusPieChart data={inventoryStatusData} isLoading={chartLoading} />
                <ProductTypeBarChart data={inventoryStatusData} isLoading={chartLoading} />
              </div>
              <TopProductsChart data={inventoryStatusData} isLoading={chartLoading} />
            </div>
            <div className="lg:col-span-1">
              <LowStockAlert data={lowStockData?.data} isLoading={lowStockLoading} />
            </div>
          </div>

          {/* Low Stock Products Table */}
          {(lowStockTableLoading || lowStockTableData?.length > 0) && (
            <LowStockProductsTable data={lowStockTableData} isLoading={lowStockTableLoading} />
          )}

          {/* Recent Products Table */}
          <RecentProductsTable data={recentProductsData} isLoading={recentLoading} />
        </>
      )}
    </div>
  )
}

export default DashboardPage
