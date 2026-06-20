import { useForm } from 'react-hook-form'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { enumToLabel } from '../../utils/formatters'

const PRODUCT_TYPE_OPTIONS = [
  { value: 'FINISHED_GOOD', label: 'Finished Good' },
  { value: 'RAW_MATERIAL', label: 'Raw Material' },
  { value: 'COMPONENT', label: 'Component' },
]

const PROCUREMENT_STRATEGY_OPTIONS = [
  { value: 'MTS', label: 'Make to Stock (MTS)' },
  { value: 'MTO', label: 'Make to Order (MTO)' },
]

const PROCUREMENT_TYPE_OPTIONS = [
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
]

const ProductForm = ({ onSubmit, defaultValues = {}, isLoading = false, isEdit = false }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Product Name"
        required
        placeholder="e.g. Steel Rod 10mm"
        error={errors.productName?.message}
        {...register('productName', {
          required: 'Product name is required',
          minLength: { value: 2, message: 'Minimum 2 characters' },
          maxLength: { value: 200, message: 'Maximum 200 characters' },
        })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Sales Price (₹)"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          error={errors.salesPrice?.message}
          {...register('salesPrice', {
            min: { value: 0, message: 'Cannot be negative' },
            valueAsNumber: true,
          })}
        />
        <Input
          label="Cost Price (₹)"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          error={errors.costPrice?.message}
          {...register('costPrice', {
            min: { value: 0, message: 'Cannot be negative' },
            valueAsNumber: true,
          })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Product Type"
          required
          options={PRODUCT_TYPE_OPTIONS}
          error={errors.productType?.message}
          placeholder="Select type..."
          {...register('productType', { required: 'Product type is required' })}
        />
        <Select
          label="Procurement Strategy"
          required
          options={PROCUREMENT_STRATEGY_OPTIONS}
          error={errors.procurementStrategy?.message}
          placeholder="Select strategy..."
          {...register('procurementStrategy', { required: 'Strategy is required' })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Procurement Type"
          required
          options={PROCUREMENT_TYPE_OPTIONS}
          error={errors.procurementType?.message}
          placeholder="Select type..."
          {...register('procurementType', { required: 'Procurement type is required' })}
        />
        <Input
          label="Vendor"
          placeholder="Vendor name (optional)"
          error={errors.vendor?.message}
          {...register('vendor')}
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          rows={3}
          placeholder="Product description..."
          className="input-field resize-none"
          {...register('description', { maxLength: { value: 1000, message: 'Max 1000 characters' } })}
        />
        {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}

export default ProductForm
