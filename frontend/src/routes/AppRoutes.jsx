import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/layout/ProtectedRoute'
import AppLayout from '../components/layout/AppLayout'
import { ROLES } from '../constants/roles'

// Pages
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

// ─── Role Groups (mirrors backend permissions.js) ────────────────────────────
const SALES_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER]
const SALES_READ_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER]
const INVENTORY_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.INVENTORY_MANAGER]

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

        {/* Products — admin, business owner, sales, inventory */}
        <Route
          path="products"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER]}>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER, ROLES.INVENTORY_MANAGER]}>
              <ProductDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Inventory — admin, business owner, inventory manager */}
        <Route
          path="inventory"
          element={
            <ProtectedRoute allowedRoles={INVENTORY_ROLES}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory/movements"
          element={
            <ProtectedRoute allowedRoles={INVENTORY_ROLES}>
              <InventoryMovementsPage />
            </ProtectedRoute>
          }
        />

        {/* Customers — admin, business owner, sales */}
        <Route
          path="customers"
          element={
            <ProtectedRoute allowedRoles={SALES_ROLES}>
              <CustomersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers/:id"
          element={
            <ProtectedRoute allowedRoles={SALES_ROLES}>
              <CustomerDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Sales Orders — admin, business owner, sales, inventory (read-only for inventory) */}
        <Route
          path="sales"
          element={
            <ProtectedRoute allowedRoles={SALES_READ_ROLES}>
              <SalesOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales/:id"
          element={
            <ProtectedRoute allowedRoles={SALES_READ_ROLES}>
              <SalesOrderDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Sales Analytics — admin, business owner, sales */}
        <Route
          path="sales-analytics"
          element={
            <ProtectedRoute allowedRoles={SALES_ROLES}>
              <SalesAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Users — admin only */}
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <UserDetailPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
