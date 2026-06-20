/**
 * AvailabilityIndicator — Inline stock availability check during sales order creation.
 * Shows free stock, ordered quantity and whether the order can be fulfilled.
 */
import StockStatusBadge from './StockStatusBadge'

const AvailabilityIndicator = ({ freeQty = 0, requestedQty = 0, productName = '' }) => {
  const isAvailable = freeQty >= requestedQty
  const shortage = Math.max(0, requestedQty - freeQty)

  return (
    <div className={`mt-1.5 p-2 rounded-lg border text-xs flex items-start gap-2 ${
      isAvailable
        ? 'bg-emerald-500/5 border-emerald-500/15'
        : 'bg-rose-500/5 border-rose-500/15'
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <StockStatusBadge freeQty={freeQty} requestedQty={requestedQty} size="sm" showQty={false} />
          <span className="text-slate-500">
            {freeQty} available · {requestedQty} requested
          </span>
        </div>
        {!isAvailable && shortage > 0 && (
          <p className="text-rose-400 mt-0.5">
            ⚠ Shortage: {shortage} unit{shortage > 1 ? 's' : ''} short — order can still be saved as Draft.
          </p>
        )}
      </div>
    </div>
  )
}

export default AvailabilityIndicator
