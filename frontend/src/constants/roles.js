export const ROLES = {
  ADMIN: 'ADMIN',
  BUSINESS_OWNER: 'BUSINESS_OWNER',
  SALES_USER: 'SALES_USER',
  PURCHASE_USER: 'PURCHASE_USER',
  MANUFACTURING_USER: 'MANUFACTURING_USER',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
}

export const ROLE_LABELS = {
  ADMIN: 'Administrator',
  BUSINESS_OWNER: 'Business Owner',
  SALES_USER: 'Sales User',
  PURCHASE_USER: 'Purchase User',
  MANUFACTURING_USER: 'Manufacturing User',
  INVENTORY_MANAGER: 'Inventory Manager',
}

export const ROLE_LIST = Object.values(ROLES)

// Roles that can manage users
export const USER_MANAGEMENT_ROLES = [ROLES.ADMIN]

// Roles that can create/edit products
export const PRODUCT_WRITE_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER]

// Roles that can adjust inventory
export const INVENTORY_WRITE_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.INVENTORY_MANAGER]
