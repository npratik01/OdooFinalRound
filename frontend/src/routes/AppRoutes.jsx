import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/layout/ProtectedRoute'
import AppLayout from '../components/layout/AppLayout'
import { ROLES } from '../constants/roles'

// Phase 1 & 2 Pages
import LoginPage from '../pages/auth/LoginPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import ProductsPage from '../pages/products/ProductsPage'
import ProductDetailPage from '../pages/products/ProductDetailPage'
import InventoryPage from '../pages/inventory/InventoryPage'
import InventoryMovementsPage from '../pages/inventory/InventoryMovementsPage'
import UsersPage from '../pages/users/UsersPage'
import UserDetailPage from '../pages/users/UserDetailPage'
import CustomersPage from '../pages/customers/CustomersPage'
import CustomerDetailPage from '../pages/customers/CustomerDetailPage'
import SalesOrdersPage from '../pages/sales/SalesOrdersPage'
import SalesOrderDetailPage from '../pages/sales/SalesOrderDetailPage'
import SalesAnalyticsPage from '../pages/sales/SalesAnalyticsPage'
import SalesDashboardPage from '../pages/sales/SalesDashboardPage'

// Phase 3 Pages — Vendors
import VendorsPage from '../pages/vendors/VendorsPage'
import VendorDetailPage from '../pages/vendors/VendorDetailPage'
import CreateVendorPage from '../pages/vendors/CreateVendorPage'
import EditVendorPage from '../pages/vendors/EditVendorPage'

// Phase 3 Pages — Purchase Orders
import PurchaseOrdersPage from '../pages/purchase/PurchaseOrdersPage'
import PurchaseOrderDetailPage from '../pages/purchase/PurchaseOrderDetailPage'
import CreatePurchaseOrderPage from '../pages/purchase/CreatePurchaseOrderPage'
import GoodsReceiptPage from '../pages/purchase/GoodsReceiptPage'

// Phase 3 Pages — Procurement
import ProcurementDashboardPage from '../pages/procurement/ProcurementDashboardPage'
import SupplierPerformancePage from '../pages/procurement/SupplierPerformancePage'

// Phase 4 Pages — Manufacturing
import ManufacturingDashboardPage from '../pages/manufacturing/ManufacturingDashboardPage'
import ManufacturingOrdersPage from '../pages/manufacturing/ManufacturingOrdersPage'
import CreateManufacturingOrderPage from '../pages/manufacturing/CreateManufacturingOrderPage'
import ManufacturingOrderDetailPage from '../pages/manufacturing/ManufacturingOrderDetailPage'
import BOMListPage from '../pages/manufacturing/BOMListPage'
import CreateBOMPage from '../pages/manufacturing/CreateBOMPage'
import BOMDetailPage from '../pages/manufacturing/BOMDetailPage'
import WorkCentersPage from '../pages/manufacturing/WorkCentersPage'
import OperationsPage from '../pages/manufacturing/OperationsPage'

// ─── Role Groups ──────────────────────────────────────────────────────────────
const SALES_ROLES        = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER]
const SALES_READ_ROLES   = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER]
const INVENTORY_ROLES    = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.INVENTORY_MANAGER]
const ANALYTICS_ROLES    = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER]

// Phase 3 role groups
const VENDOR_READ_ROLES  = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER, ROLES.MANUFACTURING_USER]
const PURCHASE_ROLES     = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER]
const PURCHASE_READ_ROLES= [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER, ROLES.MANUFACTURING_USER]
const PROC_DASH_ROLES    = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER, ROLES.INVENTORY_MANAGER]

// Phase 4 role groups
const MFG_READ_ROLES     = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER, ROLES.INVENTORY_MANAGER]
const MFG_WRITE_ROLES    = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER]

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — all authenticated users */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard — all roles */}
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Products */}
        <Route path="products" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER, ROLES.MANUFACTURING_USER]}><ProductsPage /></ProtectedRoute>} />
        <Route path="products/:id" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER, ROLES.MANUFACTURING_USER]}><ProductDetailPage /></ProtectedRoute>} />

        {/* Inventory */}
        <Route path="inventory" element={<ProtectedRoute allowedRoles={[...INVENTORY_ROLES, ROLES.PURCHASE_USER, ROLES.MANUFACTURING_USER]}><InventoryPage /></ProtectedRoute>} />
        <Route path="inventory/movements" element={<ProtectedRoute allowedRoles={[...INVENTORY_ROLES, ROLES.MANUFACTURING_USER]}><InventoryMovementsPage /></ProtectedRoute>} />

        {/* Customers */}
        <Route path="customers" element={<ProtectedRoute allowedRoles={SALES_ROLES}><CustomersPage /></ProtectedRoute>} />
        <Route path="customers/:id" element={<ProtectedRoute allowedRoles={SALES_ROLES}><CustomerDetailPage /></ProtectedRoute>} />

        {/* Sales Orders */}
        <Route path="sales" element={<ProtectedRoute allowedRoles={SALES_READ_ROLES}><SalesOrdersPage /></ProtectedRoute>} />
        <Route path="sales/:id" element={<ProtectedRoute allowedRoles={SALES_READ_ROLES}><SalesOrderDetailPage /></ProtectedRoute>} />

        {/* Sales Dashboard & Analytics */}
        <Route path="sales-dashboard" element={<ProtectedRoute allowedRoles={ANALYTICS_ROLES}><SalesDashboardPage /></ProtectedRoute>} />
        <Route path="sales-analytics" element={<ProtectedRoute allowedRoles={ANALYTICS_ROLES}><SalesAnalyticsPage /></ProtectedRoute>} />

        {/* ── Phase 3: Vendors ────────────────────────────────────────────── */}
        <Route path="vendors" element={<ProtectedRoute allowedRoles={VENDOR_READ_ROLES}><VendorsPage /></ProtectedRoute>} />
        <Route path="vendors/new" element={<ProtectedRoute allowedRoles={PURCHASE_ROLES}><CreateVendorPage /></ProtectedRoute>} />
        <Route path="vendors/:id" element={<ProtectedRoute allowedRoles={VENDOR_READ_ROLES}><VendorDetailPage /></ProtectedRoute>} />
        <Route path="vendors/:id/edit" element={<ProtectedRoute allowedRoles={PURCHASE_ROLES}><EditVendorPage /></ProtectedRoute>} />

        {/* ── Phase 3: Purchase Orders ────────────────────────────────────── */}
        <Route path="purchase-orders" element={<ProtectedRoute allowedRoles={PURCHASE_READ_ROLES}><PurchaseOrdersPage /></ProtectedRoute>} />
        <Route path="purchase-orders/new" element={<ProtectedRoute allowedRoles={PURCHASE_ROLES}><CreatePurchaseOrderPage /></ProtectedRoute>} />
        <Route path="purchase-orders/:id" element={<ProtectedRoute allowedRoles={PURCHASE_READ_ROLES}><PurchaseOrderDetailPage /></ProtectedRoute>} />
        <Route path="purchase-orders/:id/receive" element={<ProtectedRoute allowedRoles={PURCHASE_ROLES}><GoodsReceiptPage /></ProtectedRoute>} />

        {/* ── Phase 3: Procurement Analytics ─────────────────────────────── */}
        <Route path="procurement-dashboard" element={<ProtectedRoute allowedRoles={PROC_DASH_ROLES}><ProcurementDashboardPage /></ProtectedRoute>} />
        <Route path="supplier-performance" element={<ProtectedRoute allowedRoles={PURCHASE_ROLES}><SupplierPerformancePage /></ProtectedRoute>} />

        {/* ── Phase 4: Manufacturing ────────────────────────────────────── */}
        <Route path="manufacturing-dashboard" element={<ProtectedRoute allowedRoles={MFG_READ_ROLES}><ManufacturingDashboardPage /></ProtectedRoute>} />
        <Route path="manufacturing" element={<ProtectedRoute allowedRoles={MFG_READ_ROLES}><ManufacturingOrdersPage /></ProtectedRoute>} />
        <Route path="manufacturing/new" element={<ProtectedRoute allowedRoles={MFG_WRITE_ROLES}><CreateManufacturingOrderPage /></ProtectedRoute>} />
        <Route path="manufacturing/:id" element={<ProtectedRoute allowedRoles={MFG_READ_ROLES}><ManufacturingOrderDetailPage /></ProtectedRoute>} />
        <Route path="bom" element={<ProtectedRoute allowedRoles={MFG_READ_ROLES}><BOMListPage /></ProtectedRoute>} />
        <Route path="bom/new" element={<ProtectedRoute allowedRoles={MFG_WRITE_ROLES}><CreateBOMPage /></ProtectedRoute>} />
        <Route path="bom/:id" element={<ProtectedRoute allowedRoles={MFG_READ_ROLES}><BOMDetailPage /></ProtectedRoute>} />
        <Route path="work-centers" element={<ProtectedRoute allowedRoles={MFG_READ_ROLES}><WorkCentersPage /></ProtectedRoute>} />
        <Route path="operations" element={<ProtectedRoute allowedRoles={MFG_READ_ROLES}><OperationsPage /></ProtectedRoute>} />

        {/* Users — admin only */}
        <Route path="users" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><UsersPage /></ProtectedRoute>} />
        <Route path="users/:id" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><UserDetailPage /></ProtectedRoute>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes


