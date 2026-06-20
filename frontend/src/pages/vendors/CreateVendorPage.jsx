import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { vendorApi } from '../../api/vendor.api'

const FormField = ({ label, error, children, required }) => (
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
)

const Input = ({ register, name, placeholder, type = 'text', ...rest }) => (
  <input
    type={type}
    placeholder={placeholder}
    {...register(name)}
    {...rest}
    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
  />
)

export default function CreateVendorPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      country: 'India',
      paymentTerms: 'Net 30',
      leadTimeDays: 7,
      rating: 3,
    }
  })

  const mutation = useMutation({
    mutationFn: (data) => vendorApi.createVendor(data),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success(`Vendor created: ${r.data?.data?.vendorCode}`)
      navigate(`/vendors/${r.data?.data?._id}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create vendor'),
  })

  const onSubmit = (data) => {
    mutation.mutate({
      ...data,
      leadTimeDays: parseInt(data.leadTimeDays, 10),
      rating: parseFloat(data.rating),
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">New Vendor</h1>
          <p className="text-slate-400 text-sm">Add a new supplier to your vendor database</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-primary-400" />
            <h2 className="font-semibold text-white text-sm">Basic Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormField label="Vendor Name" required error={errors.vendorName?.message}>
                <Input register={register} name="vendorName"
                  placeholder="e.g., Acme Supplies Pvt. Ltd."
                  {...register('vendorName', { required: 'Vendor name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                />
              </FormField>
            </div>
            <FormField label="Contact Person">
              <Input register={register} name="contactPerson" placeholder="e.g., John Doe" />
            </FormField>
            <FormField label="Email">
              <Input register={register} name="email" type="email" placeholder="supplier@email.com" />
            </FormField>
            <FormField label="Phone">
              <Input register={register} name="phone" placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="GST Number">
              <Input register={register} name="gstNumber" placeholder="22AAAAA0000A1Z5" />
            </FormField>
          </div>
        </div>

        {/* Address */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm">Address</h2>
          <FormField label="Street Address">
            <textarea
              {...register('address')}
              rows={2}
              placeholder="Street / Area"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </FormField>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FormField label="City">
              <Input register={register} name="city" placeholder="Mumbai" />
            </FormField>
            <FormField label="State">
              <Input register={register} name="state" placeholder="Maharashtra" />
            </FormField>
            <FormField label="Country">
              <Input register={register} name="country" placeholder="India" />
            </FormField>
            <FormField label="Pincode">
              <Input register={register} name="pincode" placeholder="400001" />
            </FormField>
          </div>
        </div>

        {/* Procurement Terms */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm">Procurement Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Payment Terms">
              <Input register={register} name="paymentTerms" placeholder="Net 30" />
            </FormField>
            <FormField label="Lead Time (Days)">
              <Input register={register} name="leadTimeDays" type="number" placeholder="7" />
            </FormField>
            <FormField label="Supplier Rating (1–5)">
              <select
                {...register('rating')}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-primary-500"
              >
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} ★</option>)}
              </select>
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60"
          >
            <Save size={15} />
            {mutation.isPending ? 'Creating...' : 'Create Vendor'}
          </button>
        </div>
      </form>
    </div>
  )
}
