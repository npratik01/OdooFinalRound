/**
 * StockStatusBadge — Reusable availability badge for product stock.
 * Supports: IN_STOCK, LOW_STOCK, OUT_OF_STOCK, SHORTAGE
 */
const StockStatusBadge = ({ freeQty = 0, requestedQty = 0, size = 'sm', showQty = true }) => {
  const isAvailable = freeQty >= requestedQty
  const isLow = freeQty > 0 && freeQty < requestedQty
  const isOut = freeQty === 0

  let label, colorClass, dotClass
  if (isOut) {
    label = 'Out of Stock'
    colorClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    dotClass = 'bg-rose-400'
  } else if (!isAvailable) {
    label = 'Shortage'
    colorClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    dotClass = 'bg-amber-400'
  } else {
    label = 'In Stock'
    colorClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    dotClass = 'bg-emerald-400'
  }

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${colorClass} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      {label}
      {showQty && (
        <span className="opacity-70">({freeQty} free)</span>
      )}
    </span>
  )
}

export default StockStatusBadge
