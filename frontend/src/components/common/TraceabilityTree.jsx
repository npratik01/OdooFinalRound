import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  FileText, Factory, ShoppingCart, Truck, 
  CheckSquare, ArrowRight, Link as LinkIcon, Compass
} from 'lucide-react'
import { traceabilityApi } from '../../api/traceability.api'
import LoadingSpinner from './LoadingSpinner'
import Badge from './Badge'
import { formatDate } from '../../utils/formatters'

// Document details styling mapper
const DOC_CONFIG = {
  SalesOrder: {
    icon: FileText,
    colorClass: 'from-blue-600 to-indigo-600',
    borderClass: 'border-blue-500/30',
    bgClass: 'bg-blue-950/20',
    linkPrefix: '/sales/',
  },
  ManufacturingOrder: {
    icon: Factory,
    colorClass: 'from-amber-500 to-orange-600',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-950/20',
    linkPrefix: '/manufacturing/',
  },
  PurchaseOrder: {
    icon: ShoppingCart,
    colorClass: 'from-emerald-600 to-teal-600',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-950/20',
    linkPrefix: '/purchase-orders/',
  },
  GoodsReceipt: {
    icon: CheckSquare,
    colorClass: 'from-cyan-600 to-blue-600',
    borderClass: 'border-cyan-500/30',
    bgClass: 'bg-cyan-950/20',
    linkPrefix: '/purchase-orders/', // PO page has receipts view
  },
  Delivery: {
    icon: Truck,
    colorClass: 'from-purple-600 to-pink-600',
    borderClass: 'border-purple-500/30',
    bgClass: 'bg-purple-950/20',
    linkPrefix: '/sales/', // Sales order details contains delivery tracking
  },
}

export default function TraceabilityTree({ docId }) {
  const { data: flowData, isLoading, isError } = useQuery({
    queryKey: ['traceability-flow', docId],
    queryFn: () => traceabilityApi.getFlow(docId).then(r => r.data?.data),
    enabled: !!docId,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-800/40 rounded-2xl border border-slate-700/40 min-h-60">
        <LoadingSpinner />
        <p className="text-slate-400 text-xs mt-3">Constructing Traceability Tree...</p>
      </div>
    )
  }

  if (isError || !flowData) {
    return (
      <div className="p-8 text-center text-red-400 bg-slate-800/40 rounded-2xl border border-slate-700/40 min-h-60">
        Failed to load traceability flow data
      </div>
    )
  }

  const { nodes = [], edges = [] } = flowData

  if (nodes.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-800/40 rounded-2xl border border-slate-700/40 min-h-60 text-center">
        <Compass className="text-slate-500 mb-2 opacity-30" size={32} />
        <p className="text-slate-400 text-sm font-semibold">No Related Workflows</p>
        <p className="text-slate-500 text-xs mt-1">This document has no parent or child transactional dependencies.</p>
      </div>
    )
  }

  // 1. Group nodes into Columns based on doc type for clean flow diagram
  const colDemand = nodes.filter(n => n.type === 'SalesOrder')
  const colSupply = nodes.filter(n => n.type === 'ManufacturingOrder' || n.type === 'PurchaseOrder')
  const colFulfillment = nodes.filter(n => n.type === 'Delivery' || n.type === 'GoodsReceipt')

  // Render a single node card
  const renderNodeCard = (node) => {
    const isCurrent = node.id === docId
    const cfg = DOC_CONFIG[node.type] || {
      icon: LinkIcon,
      colorClass: 'from-slate-600 to-slate-700',
      borderClass: 'border-slate-700',
      bgClass: 'bg-slate-800',
      linkPrefix: '#',
    }
    const Icon = cfg.icon

    return (
      <div 
        key={node.id} 
        className={`relative flex flex-col p-4 rounded-xl border transition-all duration-300 w-full max-w-sm shrink-0
          ${isCurrent 
            ? 'bg-slate-800 border-primary-500/60 shadow-lg shadow-primary-500/10 ring-1 ring-primary-500/20' 
            : `${cfg.bgClass} ${cfg.borderClass} hover:border-slate-600 hover:bg-slate-800/80`
          }`}
      >
        {isCurrent && (
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow">
            Current
          </span>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.colorClass} flex items-center justify-center shadow`}>
              <Icon className="text-white" size={15} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">
                {node.type.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <Link 
                to={`${cfg.linkPrefix}${node.id}`}
                className="font-mono font-bold text-sm text-white hover:text-primary-400 transition-colors mt-1 block"
              >
                {node.label}
              </Link>
            </div>
          </div>
          <Badge variant={
            ['Done', 'Fully Received', 'Fully Delivered', 'Processed'].includes(node.status) 
              ? 'success' 
              : ['Draft', 'Confirmed', 'In Progress', 'Partially Received', 'Partially Delivered'].includes(node.status) 
                ? 'warning' 
                : 'danger'
          }>
            {node.status}
          </Badge>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/40 flex flex-col gap-1 text-xs">
          <p className="text-slate-300 line-clamp-1">{node.summary}</p>
          {node.date && (
            <p className="text-slate-500 font-mono text-[10px]">{formatDate(node.date)}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white">Workflow Traceability Map</h3>
        <p className="text-slate-400 text-xs mt-0.5">Visual representation of parent-child transactional documents triggered in the ERP system</p>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
        <div className="flex items-stretch justify-start gap-12 md:gap-16 min-w-[700px] py-4">
          
          {/* Column 1: Demand (SO) */}
          {colDemand.length > 0 && (
            <div className="flex-1 flex flex-col justify-center gap-6">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-center border-b border-slate-800 pb-2">
                1. Demand (Sales)
              </p>
              <div className="flex flex-col items-center gap-4">
                {colDemand.map(renderNodeCard)}
              </div>
            </div>
          )}

          {/* Arrow Spacer 1 */}
          {colDemand.length > 0 && colSupply.length > 0 && (
            <div className="flex flex-col justify-center items-center">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 shadow-inner">
                <ArrowRight size={14} className="animate-pulse" />
              </div>
            </div>
          )}

          {/* Column 2: Supply (PO/MO) */}
          {colSupply.length > 0 && (
            <div className="flex-[1.2] flex flex-col justify-center gap-6">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-center border-b border-slate-800 pb-2">
                2. Supply (Procurement / Mfg)
              </p>
              <div className="flex flex-col items-center gap-4">
                {colSupply.map(renderNodeCard)}
              </div>
            </div>
          )}

          {/* Arrow Spacer 2 */}
          {colSupply.length > 0 && colFulfillment.length > 0 && (
            <div className="flex flex-col justify-center items-center">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 shadow-inner">
                <ArrowRight size={14} className="animate-pulse" />
              </div>
            </div>
          )}

          {/* Column 3: Fulfillment (Delivery/Receipts) */}
          {colFulfillment.length > 0 && (
            <div className="flex-1 flex flex-col justify-center gap-6">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-center border-b border-slate-800 pb-2">
                3. Fulfillment (Logistics)
              </p>
              <div className="flex flex-col items-center gap-4">
                {colFulfillment.map(renderNodeCard)}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
