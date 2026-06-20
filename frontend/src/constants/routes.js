export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  INVENTORY: '/inventory',
  USERS: '/users',
  USER_DETAIL: '/users/:id',
}

export const buildRoute = {
  productDetail: (id) => `/products/${id}`,
  userDetail: (id) => `/users/${id}`,
}
