/**
 * OrderSummary — Shows itemized order breakdown and total.
 * Used inside Sales Order create/edit forms.
 */
import { formatCurrency } from '../../utils/formatters'
import StockStatusBadge from './StockStatusBadge'

const OrderSummary = ({ items = [], products = [] }) => {
  const getProduct = (id) => products.find((p) => p._id === id)
  const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const hasItems = items.some((item) => item.productId && item.quantity > 0)

  if (!hasItems) {
    return (
      <div className="text-xs text-slate-500 text-center py-4">
        Add products above to see order summary.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.filter((item) => item.productId).map((item, idx) => {
        const product = getProduct(item.productId)
        const freeQty = product?.inventory?.freeToUseQty ?? 0
        const subtotal = item.quantity * item.unitPrice

        return (
          <div
            key={idx}
            className="flex items-center justify-between text-sm py-2 border-b border-slate-800/50 last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-200 truncate">{product?.productName || 'Unknown'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </span>
                {product && (
                  <StockStatusBadge
                    freeQty={freeQty}
                    requestedQty={item.quantity}
                    size="sm"
                    showQty={false}
                  />
                )}
              </div>
            </div>
            <span className="font-semibold text-slate-200 ml-4 shrink-0">{formatCurrency(subtotal)}</span>
          </div>
        )
      })}

      <div className="flex justify-between items-center pt-2 border-t border-slate-700">
        <span className="text-sm font-semibold text-slate-300">Order Total</span>
        <span className="text-lg font-bold text-white">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

export default OrderSummary
