import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Factory, ClipboardList, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { createManufacturingOrder, fetchBOMs } from '../../api/manufacturing.api'
import { productApi } from '../../api/product.api'
import { userApi } from '../../api/user.api'

const InputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
const LabelCls = "block text-xs font-medium text-slate-400 mb-1.5"

export default function CreateManufacturingOrderPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedProduct, setSelectedProduct] = useState('')

  // 1. Fetch Finished Goods Products (filter by type or get all)
  const { data: products } = useQuery({
    queryKey: ['products-mfg'],
    queryFn:  () => productApi.getProducts({ isActive: 'true', limit: 200 }),
    select:   r => r.data?.data?.products || [],
  })

  // 2. Fetch Users for Assignment
  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn:  () => userApi.getUsers({ limit: 100 }),
    select:   r => r.data?.data?.users || [],
  })

  // 3. Fetch BoMs for the selected product
  const { data: boms, refetch: refetchBOMs } = useQuery({
    queryKey: ['product-boms', selectedProduct],
    queryFn:  () => fetchBOMs({ productId: selectedProduct, status: 'Active', isActive: 'true' }),
    enabled:  !!selectedProduct,
    select:   r => r.data?.data?.boms || [],
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      productId: '',
      bomId: '',
      quantityToProduce: 1,
      plannedStartDate: '',
      plannedEndDate: '',
      assignedTo: '',
      remarks: '',
    }
  })

  const watchedProductId = watch('productId')

  useEffect(() => {
    if (watchedProductId) {
      setSelectedProduct(watchedProductId)
      setValue('bomId', '') // Reset BOM select when product changes
    } else {
      setSelectedProduct('')
    }
  }, [watchedProductId, setValue])

  const mutation = useMutation({
    mutationFn: data => createManufacturingOrder(data),
    onSuccess: r => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] })
      toast.success(`MO Created: ${r.data?.data?.mo?.moNumber}`)
      navigate(`/manufacturing/${r.data?.data?.mo?._id}`)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create MO'),
  })

  const onSubmit = data => {
    mutation.mutate({
      ...data,
      quantityToProduce: parseInt(data.quantityToProduce, 10),
      plannedStartDate:  data.plannedStartDate || null,
      plannedEndDate:    data.plannedEndDate   || null,
      assignedTo:        data.assignedTo       || null,
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Factory size={22} className="text-violet-400" />
            New Manufacturing Order
          </h1>
          <p className="text-slate-400 text-sm">Schedule a production run for a finished good</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Details */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={16} className="text-violet-400" />
            <h2 className="font-semibold text-white text-sm">Order Parameters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={LabelCls}>Product to Manufacture <span className="text-red-400">*</span></label>
              <select
                {...register('productId', { required: 'Product is required' })}
                className={InputCls}
              >
                <option value="">Select Finished Product</option>
                {(products || []).map(p => (
                  <option key={p._id} value={p._id}>{p.productName} ({p.sku})</option>
                ))}
              </select>
              {errors.productId && <p className="text-xs text-red-400 mt-1">{errors.productId.message}</p>}
            </div>

            <div>
              <label className={LabelCls}>Bill of Materials (BoM) <span className="text-red-400">*</span></label>
              <select
                {...register('bomId', { required: 'BoM is required' })}
                disabled={!selectedProduct}
                className={InputCls}
              >
                <option value="">Select Active BoM</option>
                {(boms || []).map(b => (
                  <option key={b._id} value={b._id}>{b.bomCode} (v{b.version})</option>
                ))}
              </select>
              {errors.bomId && <p className="text-xs text-red-400 mt-1">{errors.bomId.message}</p>}
              {!selectedProduct && (
                <p className="text-xs text-slate-500 mt-1">Please select a product first</p>
              )}
              {selectedProduct && boms?.length === 0 && (
                <p className="text-xs text-amber-400 mt-1">No Active BoMs found for this product. Please create one.</p>
              )}
            </div>

            <div>
              <label className={LabelCls}>Quantity to Produce <span className="text-red-400">*</span></label>
              <input
                type="number"
                min={1}
                {...register('quantityToProduce', {
                  required: 'Quantity is required',
                  min: { value: 1, message: 'Must be at least 1' }
                })}
                className={InputCls}
              />
              {errors.quantityToProduce && <p className="text-xs text-red-400 mt-1">{errors.quantityToProduce.message}</p>}
            </div>

            <div>
              <label className={LabelCls}>Assigned Production Lead</label>
              <select {...register('assignedTo')} className={InputCls}>
                <option value="">Unassigned</option>
                {(users || []).map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LabelCls}>Planned Start Date</label>
              <input type="date" {...register('plannedStartDate')} className={InputCls} />
            </div>

            <div>
              <label className={LabelCls}>Planned End Date</label>
              <input type="date" {...register('plannedEndDate')} className={InputCls} />
            </div>
          </div>

          <div>
            <label className={LabelCls}>Remarks</label>
            <textarea
              {...register('remarks')}
              rows={3}
              placeholder="Operational notes, instructions, etc."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm text-slate-400 bg-slate-800 border border-slate-700 rounded-xl hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60">
            <Save size={15} />
            {mutation.isPending ? 'Scheduling...' : 'Save Draft MO'}
          </button>
        </div>
      </form>
    </div>
  )
}
