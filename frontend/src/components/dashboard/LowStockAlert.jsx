import { AlertTriangle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../common/LoadingSpinner'
import { enumToLabel, formatNumber } from '../../utils/formatters'

const LowStockAlert = ({ data, isLoading }) => {
  const navigate = useNavigate()

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="text-amber-400" size={16} />
          </div>
          <h3 className="font-semibold text-white text-sm">Low Stock Alerts</h3>
        </div>
        {data?.length > 0 && (
          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
            {data.length} item{data.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : !data?.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm font-medium text-slate-300">All stock levels are healthy</p>
            <p className="text-xs text-slate-500 mt-1">No items below minimum threshold</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {data.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-700/30 transition-colors cursor-pointer"
                onClick={() => navigate('/inventory')}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-amber-400" size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.productId?.productName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {enumToLabel(item.productId?.productType)} •{' '}
                    <span className="font-mono">{item.productId?.sku}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-amber-400">{formatNumber(item.onHandQty)}</p>
                  <p className="text-xs text-slate-500">Min: {formatNumber(item.minimumStockLevel)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data?.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-700">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
          >
            View Inventory <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default LowStockAlert
