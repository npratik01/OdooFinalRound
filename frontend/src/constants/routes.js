export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  INVENTORY: '/inventory',
  USERS: '/users',
  USER_DETAIL: '/users/:id',
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: '/customers/:id',
  SALES: '/sales',
  SALES_DETAIL: '/sales/:id',
  MOVEMENTS: '/inventory/movements',
}

export const buildRoute = {
  productDetail: (id) => `/products/${id}`,
  userDetail: (id) => `/users/${id}`,
  customerDetail: (id) => `/customers/${id}`,
  salesDetail: (id) => `/sales/${id}`,
}
