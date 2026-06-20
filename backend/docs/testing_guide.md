# Mini ERP Testing Guide

This guide describes the manual validation procedures, test cases, module checklists, and Postman structure to verify the Phase 1 Mini ERP endpoints.

---

## 1. Postman Collection Structure (Mock JSON)

Create a file named `mini-erp-phase1.postman_collection.json` containing this base config to import directly:

```json
{
  "info": {
    "name": "Mini ERP Phase 1 Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth - Login",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"admin@erp.com\",\n  \"password\": \"Admin@123\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/auth/login"
        }
      }
    },
    {
      "name": "Users - List Users",
      "request": {
        "method": "GET",
        "header": [
          { "key": "Authorization", "value": "Bearer {{jwt_token}}" }
        ],
        "url": {
          "raw": "http://localhost:5000/api/users?page=1&limit=10"
        }
      }
    },
    {
      "name": "Products - List Products",
      "request": {
        "method": "GET",
        "header": [
          { "key": "Authorization", "value": "Bearer {{jwt_token}}" }
        ],
        "url": {
          "raw": "http://localhost:5000/api/products?productType=FINISHED_GOOD"
        }
      }
    },
    {
      "name": "Inventory - Increase Stock",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{jwt_token}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"qty\": 25\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/inventory/{{productId}}/increase"
        }
      }
    }
  ]
}
```

---

## 2. Module Testing Checklist

### Auth & RBAC
- [ ] Login returns `success: true` + token.
- [ ] Blank credentials return Joi validation warnings.
- [ ] Accessing `/api/users` without Bearer token returns 401.
- [ ] Logging in as `inventory@erp.com` and modifying `/users` returns 403 Forbidden.

### Users
- [ ] Creation with invalid email format returns Joi validation error.
- [ ] Users can be toggled inactive and cannot log in anymore.
- [ ] Self-deactivation is blocked.

### Products
- [ ] Creating product generates a unique SKU automatically.
- [ ] Searching by SKU substring filters table.
- [ ] Filtering by productType, procurementStrategy, and procurementType is functional.

### Inventory
- [ ] Adjusting quantities directly checks validation rules.
- [ ] Increasing stock works synchronously.
- [ ] Decreasing stock fails if the decrement quantity exceeds `freeToUseQty`.
- [ ] Reserving stock fails if the reservation quantity exceeds `freeToUseQty`.

---

## 3. Manual Testing Steps

1. **Clean state setup**:
   ```bash
   node seeders/seed.js
   ```
2. **Login check**:
   - Access `http://localhost:5173/login`.
   - Log in using `admin@erp.com` and `Admin@123`.
3. **Verify Dashboard statistics**:
   - Confirm 4 KPI boxes display. Check total valuation equals `Σ costPrice × onHandQty`.
4. **Test low stock trigger**:
   - Go to `Products` page and click any product.
   - Choose `Adjust Inventory` and set `minimumStockLevel` greater than `onHandQty`.
   - Ensure the alert banner appears on both the dashboard and the product's detail sheet.
5. **Verify Reservation system**:
   - In Inventory page, click **Reserve** on a row. Enter amount.
   - Reserved quantity increases, free-to-use drops accordingly.
