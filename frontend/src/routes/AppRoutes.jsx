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
import UsersPage from '../pages/users/UsersPage'
import UserDetailPage from '../pages/users/UserDetailPage'
import CustomersPage from '../pages/customers/CustomersPage'
import CustomerDetailPage from '../pages/customers/CustomerDetailPage'
import SalesOrdersPage from '../pages/sales/SalesOrdersPage'
import SalesOrderDetailPage from '../pages/sales/SalesOrderDetailPage'
import InventoryMovementsPage from '../pages/inventory/InventoryMovementsPage'

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
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/movements" element={<InventoryMovementsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="sales" element={<SalesOrdersPage />} />
        <Route path="sales/:id" element={<SalesOrderDetailPage />} />

        {/* Admin only */}
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
