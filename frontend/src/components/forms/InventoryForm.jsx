import { useForm } from 'react-hook-form'
import Input from '../common/Input'
import Button from '../common/Button'
import AlertBanner from '../common/AlertBanner'

const InventoryForm = ({ onSubmit, currentInventory = {}, isLoading = false }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      onHandQty: currentInventory.onHandQty ?? 0,
      reservedQty: currentInventory.reservedQty ?? 0,
      minimumStockLevel: currentInventory.minimumStockLevel ?? 0,
    },
  })

  const onHandQty = watch('onHandQty', currentInventory.onHandQty ?? 0)
  const reservedQty = watch('reservedQty', currentInventory.reservedQty ?? 0)
  const freeToUse = Math.max(0, Number(onHandQty) - Number(reservedQty))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AlertBanner
        variant="info"
        message="Adjusting inventory will recalculate the stock status automatically."
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="On-Hand Quantity"
          type="number"
          min="0"
          step="1"
          required
          error={errors.onHandQty?.message}
          {...register('onHandQty', {
            required: 'Required',
            min: { value: 0, message: 'Cannot be negative' },
            valueAsNumber: true,
          })}
        />
        <Input
          label="Reserved Quantity"
          type="number"
          min="0"
          step="1"
          required
          error={errors.reservedQty?.message}
          {...register('reservedQty', {
            required: 'Required',
            min: { value: 0, message: 'Cannot be negative' },
            validate: (val) =>
              Number(val) <= Number(onHandQty) || 'Cannot exceed on-hand quantity',
            valueAsNumber: true,
          })}
        />
      </div>

      <Input
        label="Minimum Stock Level (Low-stock threshold)"
        type="number"
        min="0"
        step="1"
        required
        hint="Stock status becomes LOW_STOCK when on-hand quantity falls at or below this value"
        error={errors.minimumStockLevel?.message}
        {...register('minimumStockLevel', {
          required: 'Required',
          min: { value: 0, message: 'Cannot be negative' },
          valueAsNumber: true,
        })}
      />

      {/* Live preview */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Live Preview</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{Number(onHandQty) || 0}</p>
            <p className="text-xs text-slate-500 mt-1">On Hand</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">{Number(reservedQty) || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Reserved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{freeToUse}</p>
            <p className="text-xs text-slate-500 mt-1">Free to Use</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isLoading}>
          Adjust Inventory
        </Button>
      </div>
    </form>
  )
}

export default InventoryForm
