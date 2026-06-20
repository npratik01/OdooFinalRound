import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, Package, Cpu } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBOM, fetchOperations } from '../../api/manufacturing.api'
import { productApi } from '../../api/product.api'

const InputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
const LabelCls = "block text-xs font-medium text-slate-400 mb-1.5"

export default function CreateBOMPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 1. Fetch products
  const { data: products } = useQuery({
    queryKey: ['products-bom-fg'],
    queryFn:  () => productApi.getProducts({ isActive: 'true', limit: 200 }),
    select:   r => r.data?.data?.products || [],
  })

  // 2. Fetch operations
  const { data: operations } = useQuery({
    queryKey: ['operations-all'],
    queryFn:  () => fetchOperations({ isActive: 'true', limit: 100 }),
    select:   r => r.data?.data?.operations || [],
  })

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      productId: '',
      version: '1.0',
      description: '',
      components: [{ productId: '', quantityRequired: 1, unit: 'Units' }],
      operations: [{ operationId: '', sequence: 1 }],
    }
  })

  const { fields: compFields, append: compAppend, remove: compRemove } = useFieldArray({
    control, name: 'components'
  })

  const { fields: opFields, append: opAppend, remove: opRemove } = useFieldArray({
    control, name: 'operations'
  })

  const mutation = useMutation({
    mutationFn: data => createBOM(data),
    onSuccess: r => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      toast.success(`BoM Created: ${r.data?.data?.bom?.bomCode}`)
      navigate(`/bom/${r.data?.data?.bom?._id}`)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create BoM'),
  })

  const onSubmit = data => {
    // Validate operations sequence ordering
    const sortedOps = data.operations.slice().sort((a, b) => parseInt(a.sequence, 10) - parseInt(b.sequence, 10))
    mutation.mutate({
      ...data,
      components: data.components.map(c => ({
        productId:        c.productId,
        quantityRequired: parseFloat(c.quantityRequired),
        unit:             c.unit || 'Units',
      })),
      operations: sortedOps.map((op, idx) => ({
        operationId: op.operationId,
        sequence:    idx + 1, // enforce sequential sequence indexing
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
          <h1 className="text-2xl font-bold text-white">New Bill of Materials (BoM)</h1>
          <p className="text-slate-400 text-sm">Define components and routing sequences for a manufactured product</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Metadata */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className={LabelCls}>Finished Product <span className="text-red-400">*</span></label>
              <select
                {...register('productId', { required: 'Product is required' })}
                className={InputCls}
              >
                <option value="">Select Target Finished Product</option>
                {(products || []).map(p => (
                  <option key={p._id} value={p._id}>{p.productName} ({p.sku})</option>
                ))}
              </select>
              {errors.productId && <p className="text-xs text-red-400 mt-1">{errors.productId.message}</p>}
            </div>
            <div>
              <label className={LabelCls}>Version <span className="text-red-400">*</span></label>
              <input type="text" {...register('version', { required: 'Version is required' })} className={InputCls} />
            </div>
          </div>
          <div>
            <label className={LabelCls}>Description</label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Optional notes or revision details..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
        </div>

        {/* Components Grid */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-violet-400" />
              <h2 className="font-semibold text-white text-sm">Components (Raw Materials)</h2>
            </div>
            <button
              type="button"
              onClick={() => compAppend({ productId: '', quantityRequired: 1, unit: 'Units' })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors"
            >
              <Plus size={13} /> Add Component
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-[55%]">Product</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-[20%]">Quantity</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-[20%]">Unit</th>
                  <th className="px-5 py-3 w-[5%]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {compFields.map((field, idx) => (
                  <tr key={field.id}>
                    <td className="px-5 py-2.5">
                      <select
                        {...register(`components.${idx}.productId`, { required: true })}
                        className={InputCls}
                      >
                        <option value="">Select Raw Material / Component</option>
                        {(products || []).map(p => (
                          <option key={p._id} value={p._id}>{p.productName} ({p.sku})</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-2.5">
                      <input
                        type="number"
                        step="any"
                        min="0.0001"
                        {...register(`components.${idx}.quantityRequired`, { required: true })}
                        className={`${InputCls} text-right`}
                      />
                    </td>
                    <td className="px-5 py-2.5">
                      <input
                        type="text"
                        placeholder="e.g. Units, kg"
                        {...register(`components.${idx}.unit`)}
                        className={InputCls}
                      />
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      {compFields.length > 1 && (
                        <button type="button" onClick={() => compRemove(idx)} className="text-slate-600 hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operations Sequences */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-violet-400" />
              <h2 className="font-semibold text-white text-sm">Routing & Operations</h2>
            </div>
            <button
              type="button"
              onClick={() => opAppend({ operationId: '', sequence: opFields.length + 1 })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors"
            >
              <Plus size={13} /> Add Operation
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-[20%]">Sequence</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-[70%]">Operation (Work Center)</th>
                  <th className="px-5 py-3 w-[10%]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {opFields.map((field, idx) => (
                  <tr key={field.id}>
                    <td className="px-5 py-2.5">
                      <input
                        type="number"
                        min={1}
                        {...register(`operations.${idx}.sequence`, { required: true })}
                        className={`${InputCls} w-24`}
                      />
                    </td>
                    <td className="px-5 py-2.5">
                      <select
                        {...register(`operations.${idx}.operationId`, { required: true })}
                        className={InputCls}
                      >
                        <option value="">Select Production Operation</option>
                        {(operations || []).map(op => (
                          <option key={op._id} value={op._id}>
                            {op.operationName} ({op.workCenterId?.workCenterName || 'No Work Center'})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      {opFields.length > 1 && (
                        <button type="button" onClick={() => opRemove(idx)} className="text-slate-600 hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm text-slate-400 bg-slate-800 border border-slate-700 rounded-xl hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60">
            <Save size={15} />
            {mutation.isPending ? 'Saving...' : 'Save Draft BoM'}
          </button>
        </div>
      </form>
    </div>
  )
}
