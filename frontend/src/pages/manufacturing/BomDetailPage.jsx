import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Plus, Trash2, Cpu, FileText, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import { bomApi } from '../../api/bom.api'
import { productApi } from '../../api/product.api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const MFG_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER]

export default function BomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole(MFG_ROLES)
  const isNew = id === 'new'

  // Form State
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [version, setVersion] = useState('1')
  const [description, setDescription] = useState('')
  const [components, setComponents] = useState([{ productId: '', quantity: '1', uom: 'units' }])

  // 1. Fetch products list for select options
  const { data: products } = useQuery({
    queryKey: ['active-products'],
    queryFn:  () => productApi.getProducts({ isActive: 'true', limit: 100 }),
    select:   r => r.data?.data || [],
  })

  // 2. Fetch BoM details if editing
  const { data: bom, isLoading: bomLoading } = useQuery({
    queryKey: ['bom', id],
    queryFn:  () => bomApi.getBomById(id),
    enabled:  !isNew,
    select:   r => r.data?.data,
  })

  // Sync form states with loaded BoM data
  useEffect(() => {
    if (bom && !isNew) {
      setProductId(bom.productId?._id || bom.productId || '')
      setQuantity(String(bom.quantity || 1))
      setVersion(String(bom.version || 1))
      setDescription(bom.description || '')
      if (bom.components && bom.components.length > 0) {
        setComponents(
          bom.components.map((c) => ({
            productId: c.productId?._id || c.productId || '',
            quantity: String(c.quantity),
            uom: c.uom || 'units',
          }))
        )
      }
    }
  }, [bom, isNew])

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload) => bomApi.createBom(payload),
    onSuccess: (res) => {
      toast.success(`Bill of Materials ${res.data?.data?.bomCode} created!`)
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      navigate('/bom')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create BoM'),
  })

  const deactivateMutation = useMutation({
    mutationFn: () => bomApi.deactivateBom(id),
    onSuccess: () => {
      toast.success('Bill of Materials deactivated!')
      queryClient.invalidateQueries({ queryKey: ['bom', id] })
      queryClient.invalidateQueries({ queryKey: ['boms'] })
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to deactivate BoM'),
  })

  const handleAddComponent = () => {
    setComponents([...components, { productId: '', quantity: '1', uom: 'units' }])
  }

  const handleRemoveComponent = (index) => {
    if (components.length === 1) {
      toast.error('A Bill of Materials must have at least one component')
      return
    }
    setComponents(components.filter((_, i) => i !== index))
  }

  const handleComponentChange = (index, field, value) => {
    const updated = [...components]
    updated[index][field] = value
    setComponents(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!productId) {
      toast.error('Please select the output product')
      return
    }

    // Validation checks
    const validComponents = components.filter(c => c.productId && parseFloat(c.quantity) > 0)
    if (validComponents.length === 0) {
      toast.error('Please add at least one valid component with quantity > 0')
      return
    }

    // Check for circular reference (product using itself)
    const hasSelfReference = validComponents.some(c => c.productId === productId)
    if (hasSelfReference) {
      toast.error('The output product cannot be used as one of its own components')
      return
    }

    const payload = {
      productId,
      quantity: parseFloat(quantity),
      version: parseInt(version, 10),
      description,
      components: validComponents.map(c => ({
        productId: c.productId,
        quantity: parseFloat(c.quantity),
        uom: c.uom || 'units'
      }))
    }

    createMutation.mutate(payload)
  }

  if (!isNew && bomLoading) {
    return <div className="p-6"><div className="h-96 bg-slate-800/50 rounded-2xl animate-pulse" /></div>
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back and Action Buttons */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          {!isNew && bom?.isActive && canManage && (
            <button
              onClick={() => { if (window.confirm('Deactivate this Bill of Materials? This action cannot be undone.')) deactivateMutation.mutate() }}
              disabled={deactivateMutation.isPending}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl text-sm transition-all"
            >
              <Ban size={14} /> Deactivate BoM
            </button>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {isNew ? 'New Bill of Materials' : `Bill of Materials: ${bom?.bomCode}`}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isNew ? 'Design a recipe to manufacture a product' : `Configure component recipe settings`}
        </p>
      </div>

      {/* BoM Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Fields */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary-400 mb-2">
            <FileText size={18} />
            <h2 className="font-semibold text-white">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Finished Product */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Finished Product *
              </label>
              {isNew ? (
                <select
                  required
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Product...</option>
                  {products?.map(p => (
                    <option key={p._id} value={p._id}>{p.productName} ({p.sku})</option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-300 font-medium">
                  {bom?.productId?.productName || '—'}
                </div>
              )}
            </div>

            {/* Output Qty */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Output Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                disabled={!isNew}
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 disabled:bg-slate-900/50 disabled:border-slate-800 disabled:text-slate-500 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Version */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                BoM Version
              </label>
              <input
                type="number"
                min="1"
                required
                disabled={!isNew}
                value={version}
                onChange={e => setVersion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 disabled:bg-slate-900/50 disabled:border-slate-800 disabled:text-slate-500 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows="2"
              disabled={!isNew}
              placeholder="e.g. Standard production recipe for aluminum brackets"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 disabled:bg-slate-900/50 disabled:border-slate-800 disabled:text-slate-500 border border-slate-700 rounded-xl text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* Components Table */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-400">
              <Cpu size={18} />
              <h2 className="font-semibold text-white">Component List</h2>
            </div>
            {isNew && (
              <button
                type="button"
                onClick={handleAddComponent}
                className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                <Plus size={14} /> Add Row
              </button>
            )}
          </div>

          <div className="space-y-3">
            {components.map((comp, idx) => (
              <div key={idx} className="flex gap-3 items-center flex-wrap md:flex-nowrap">
                {/* Select Product */}
                <div className="flex-1 min-w-48">
                  {isNew ? (
                    <select
                      required
                      value={comp.productId}
                      onChange={e => handleComponentChange(idx, 'productId', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                    >
                      <option value="">Select Component...</option>
                      {products?.map(p => (
                        <option key={p._id} value={p._id}>{p.productName} ({p.sku})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-300 text-sm">
                      {products?.find(p => p._id === comp.productId)?.productName || comp.productId || 'Unknown Product'}
                    </div>
                  )}
                </div>

                {/* Qty */}
                <div className="w-28">
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    disabled={!isNew}
                    placeholder="Qty"
                    value={comp.quantity}
                    onChange={e => handleComponentChange(idx, 'quantity', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 disabled:bg-slate-900/50 disabled:border-slate-800 disabled:text-slate-500 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-primary-500 text-right"
                  />
                </div>

                {/* UOM */}
                <div className="w-24">
                  <input
                    type="text"
                    required
                    disabled={!isNew}
                    placeholder="UOM"
                    value={comp.uom}
                    onChange={e => handleComponentChange(idx, 'uom', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 disabled:bg-slate-900/50 disabled:border-slate-800 disabled:text-slate-500 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-primary-500 text-center"
                  />
                </div>

                {/* Actions */}
                {isNew && (
                  <button
                    type="button"
                    onClick={() => handleRemoveComponent(idx)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        {isNew && (
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/bom')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Save size={16} />
              {createMutation.isPending ? 'Saving...' : 'Save Recipe'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
