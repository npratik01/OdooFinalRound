import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { vendorApi } from '../../api/vendor.api'

const FormField = ({ label, error, children }) => (
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
)

const Input = ({ register, name, placeholder, type = 'text' }) => (
  <input
    type={type}
    placeholder={placeholder}
    {...register(name)}
    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
  />
)

export default function EditVendorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorApi.getVendorById(id),
    select: r => r.data?.data,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Populate form once vendor loads
  if (vendor && !register('vendorName')._f?.defaultValue) {
    reset({
      vendorName:    vendor.vendorName,
      contactPerson: vendor.contactPerson,
      email:         vendor.email,
      phone:         vendor.phone,
      gstNumber:     vendor.gstNumber,
      address:       vendor.address,
      city:          vendor.city,
      state:         vendor.state,
      country:       vendor.country,
      pincode:       vendor.pincode,
      paymentTerms:  vendor.paymentTerms,
      leadTimeDays:  vendor.leadTimeDays,
      rating:        vendor.rating,
    })
  }

  const mutation = useMutation({
    mutationFn: (data) => vendorApi.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      toast.success('Vendor updated successfully')
      navigate(`/vendors/${id}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update vendor'),
  })

  const onSubmit = (data) => {
    mutation.mutate({
      ...data,
      leadTimeDays: parseInt(data.leadTimeDays, 10),
      rating: parseFloat(data.rating),
    })
  }

  if (isLoading) return <div className="p-6"><div className="h-64 bg-slate-800/50 rounded-2xl animate-pulse" /></div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Vendor</h1>
          <p className="text-slate-400 text-sm">{vendor?.vendorCode} · {vendor?.vendorName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormField label="Vendor Name *" error={errors.vendorName?.message}>
                <Input register={register} name="vendorName"
                  placeholder="Vendor name"
                  {...register('vendorName', { required: 'Vendor name is required' })}
                />
              </FormField>
            </div>
            <FormField label="Contact Person"><Input register={register} name="contactPerson" /></FormField>
            <FormField label="Email"><Input register={register} name="email" type="email" /></FormField>
            <FormField label="Phone"><Input register={register} name="phone" /></FormField>
            <FormField label="GST Number"><Input register={register} name="gstNumber" /></FormField>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm">Address</h2>
          <FormField label="Street Address">
            <textarea
              {...register('address')}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </FormField>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FormField label="City"><Input register={register} name="city" /></FormField>
            <FormField label="State"><Input register={register} name="state" /></FormField>
            <FormField label="Country"><Input register={register} name="country" /></FormField>
            <FormField label="Pincode"><Input register={register} name="pincode" /></FormField>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm">Procurement Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Payment Terms"><Input register={register} name="paymentTerms" /></FormField>
            <FormField label="Lead Time (Days)"><Input register={register} name="leadTimeDays" type="number" /></FormField>
            <FormField label="Rating (1–5)">
              <select {...register('rating')} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-primary-500">
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} ★</option>)}
              </select>
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-slate-400 bg-slate-800 border border-slate-700 rounded-xl hover:text-white transition-colors">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60">
            <Save size={15} />
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
