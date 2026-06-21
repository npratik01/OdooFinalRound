import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, Building2, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { purchaseApi } from '../../api/purchase.api'
import { vendorApi } from '../../api/vendor.api'
import { productApi } from '../../api/product.api'

const InputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
const LabelCls = "block text-xs font-medium text-slate-400 mb-1.5"

export default function CreatePurchaseOrderPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [totalAmount, setTotalAmount] = useState(0)

  // Vendor & Product selectors
  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-active'],
    queryFn:  () => vendorApi.getVendors({ isActive: 'true', limit: 100 }),
    select:   r => r.data?.data?.vendors || [],
  })
  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn:  () => productApi.getProducts({ limit: 200 }),
    select:   r => r.data?.data || [],
  })

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      vendorId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      remarks: '',
      items: [{ productId: '', quantity: 1, unitCost: 0 }],
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  // Recalculate total
  useEffect(() => {
    const total = (watchedItems || []).reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unitCost || 0))
    }, 0)
    setTotalAmount(total)
  }, [watchedItems])

  const mutation = useMutation({
    mutationFn: data => purchaseApi.createPurchaseOrder(data),
    onSuccess: r => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success(`PO Created: ${r.data?.data?.poNumber}`)
      navigate(`/purchase-orders/${r.data?.data?._id}`)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create PO'),
  })

  const onSubmit = data => {
    mutation.mutate({
      ...data,
      expectedDeliveryDate: data.expectedDeliveryDate || null,
      items: data.items.map(item => ({
        productId: item.productId,
        quantity:  parseInt(item.quantity, 10),
        unitCost:  parseFloat(item.unitCost),
      })),
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">New Purchase Order</h1>
          <p className="text-slate-400 text-sm">Create a procurement request from a vendor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Vendor & Dates */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={16} className="text-primary-400" />
            <h2 className="font-semibold text-white text-sm">Vendor & Dates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className={LabelCls}>Vendor <span className="text-red-400">*</span></label>
              <select
                {...register('vendorId', { required: 'Vendor is required' })}
                className={InputCls}
              >
                <option value="">Select Vendor</option>
                {(vendorsData || []).map(v => (
                  <option key={v._id} value={v._id}>{v.vendorName} ({v.vendorCode})</option>
                ))}
              </select>
              {errors.vendorId && <p className="text-xs text-red-400 mt-1">{errors.vendorId.message}</p>}
            </div>
            <div>
              <label className={LabelCls}>Order Date</label>
              <input type="date" {...register('orderDate')} className={InputCls} />
            </div>
            <div>
              <label className={LabelCls}>Expected Delivery Date</label>
              <input type="date" {...register('expectedDeliveryDate')} className={InputCls} />
            </div>
          </div>
          <div>
            <label className={LabelCls}>Remarks</label>
            <textarea
              {...register('remarks')}
              rows={2}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-primary-400" />
              <h2 className="font-semibold text-white text-sm">Order Items</h2>
            </div>
            <button
              type="button"
              onClick={() => append({ productId: '', quantity: 1, unitCost: 0 })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors"
            >
              <Plus size={13} /> Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-[45%]">Product</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Qty</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Unit Cost (₹)</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Total</th>
                  <th className="px-5 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {fields.map((field, idx) => {
                  const qty  = parseFloat(watchedItems?.[idx]?.quantity || 0)
                  const cost = parseFloat(watchedItems?.[idx]?.unitCost || 0)
                  const lineTotal = qty * cost
                  return (
                    <tr key={field.id}>
                      <td className="px-5 py-3">
                        <select
                          {...register(`items.${idx}.productId`, { required: 'Product required' })}
                          className={InputCls}
                        >
                          <option value="">Select Product</option>
                          {(products || []).filter(p => p.isActive).map(p => (
                            <option key={p._id} value={p._id}>
                              {p.productName} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          min={1}
                          {...register(`items.${idx}.quantity`, { required: true, min: 1 })}
                          className={`${InputCls} text-right w-24`}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          {...register(`items.${idx}.unitCost`, { required: true, min: 0 })}
                          className={`${InputCls} text-right w-32`}
                        />
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-white whitespace-nowrap">
                        ₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(idx)} className="text-slate-600 hover:text-red-400 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700/50 bg-slate-900/30">
                  <td colSpan={3} className="px-5 py-3.5 text-right text-sm font-semibold text-slate-300">Total Order Amount</td>
                  <td className="px-5 py-3.5 text-right text-lg font-bold text-white whitespace-nowrap">
                    ₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm text-slate-400 bg-slate-800 border border-slate-700 rounded-xl hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60">
            <Save size={15} />
            {mutation.isPending ? 'Creating...' : 'Save Draft'}
          </button>
        </div>
      </form>
    </div>
  )
}
