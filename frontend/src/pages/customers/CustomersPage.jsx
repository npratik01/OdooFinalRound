import { useState } from 'react'
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useUpdateCustomerStatus
} from '../../hooks/useCustomers'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye, Edit, ShieldAlert, Power } from 'lucide-react'
import DataTable from '../../components/tables/DataTable'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { buildRoute } from '../../constants/routes'
import { useForm } from 'react-hook-form'

const CustomersPage = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', isActive: 'true' })
  const { data, isLoading } = useCustomers(params)
  
  const createCustomerMutation = useCreateCustomer()
  const updateCustomerMutation = useUpdateCustomer()
  const toggleStatusMutation = useUpdateCustomerStatus()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const openCreateModal = () => {
    setEditingCustomer(null)
    reset({
      customerName: '',
      email: '',
      phone: '',
      gstNumber: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (cust) => {
    setEditingCustomer(cust)
    reset({
      customerName: cust.customerName,
      email: cust.email,
      phone: cust.phone,
      gstNumber: cust.gstNumber || '',
      address: cust.address,
      city: cust.city,
      state: cust.state,
      country: cust.country,
      pincode: cust.pincode
    })
    setIsModalOpen(true)
  }

  const onSubmit = (formData) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate(
        { id: editingCustomer._id, data: formData },
        {
          onSuccess: () => {
            setIsModalOpen(false)
            reset()
          }
        }
      )
    } else {
      createCustomerMutation.mutate(formData, {
        onSuccess: () => {
          setIsModalOpen(false)
          reset()
        }
      })
    }
  }

  const columns = [
    {
      header: 'Code',
      accessor: 'customerCode',
      render: (val) => <span className="font-mono text-primary-400 font-semibold">{val}</span>,
    },
    {
      header: 'Customer Name',
      accessor: 'customerName',
      render: (val, row) => (
        <Link to={buildRoute.customerDetail(row._id)} className="hover:underline text-slate-100 font-medium">
          {val}
        </Link>
      ),
    },
    {
      header: 'Contact Info',
      accessor: 'email',
      render: (_, row) => (
        <div>
          <p className="text-slate-200 text-sm">{row.email}</p>
          <span className="text-xs text-slate-500">{row.phone}</span>
        </div>
      ),
    },
    {
      header: 'GST Number',
      accessor: 'gstNumber',
      render: (val) => <span className="text-sm text-slate-400 font-mono">{val || '—'}</span>,
    },
    {
      header: 'Location',
      accessor: 'city',
      render: (_, row) => <span className="text-sm text-slate-400">{row.city}, {row.state}</span>,
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (val) => (
        <Badge color={val ? 'emerald' : 'red'} size="sm">
          {val ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <Link to={buildRoute.customerDetail(id)}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View details">
              <Eye size={15} className="text-slate-400 hover:text-slate-100" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditModal(row)} title="Edit">
            <Edit size={15} className="text-slate-400 hover:text-primary-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => toggleStatusMutation.mutate({ id, isActive: !row.isActive })}
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            <Power size={15} className={row.isActive ? 'text-slate-400 hover:text-rose-400' : 'text-slate-400 hover:text-emerald-400'} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Directory</h1>
          <p className="text-sm text-slate-400">Manage client profiles, contact information, and GST records.</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus size={16} />
          Add Customer
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer code, name, email or phone..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary-500 transition-all duration-200"
            value={params.search}
            onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
          />
        </div>
        <select
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-primary-500"
          value={params.isActive}
          onChange={(e) => setParams((prev) => ({ ...prev, isActive: e.target.value, page: 1 }))}
        >
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
          <option value="">All Statuses</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.data || data.data.length === 0 ? (
        <EmptyState title="No customers found" description="Try refining your search terms or create a new customer record." />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <DataTable
            data={data.data}
            columns={columns}
            pagination={data.meta}
            onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
          />
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Name"
              placeholder="e.g. Reliance Industries"
              {...register('customerName', { required: 'Customer name is required' })}
              error={errors.customerName?.message}
            />
            <Input
              label="GST Number"
              placeholder="e.g. 27AAAAA1111A1Z1"
              {...register('gstNumber')}
              error={errors.gstNumber?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. procurement@reliance.com"
              {...register('email', { required: 'Email address is required' })}
              error={errors.email?.message}
            />
            <Input
              label="Phone Number"
              placeholder="e.g. +91 98765 43210"
              {...register('phone', { required: 'Phone number is required' })}
              error={errors.phone?.message}
            />
          </div>

          <Input
            label="Address"
            placeholder="e.g. Plot No 12, Corporate Block, Bandra East"
            {...register('address', { required: 'Address is required' })}
            error={errors.address?.message}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="City"
              placeholder="Mumbai"
              {...register('city', { required: 'Required' })}
              error={errors.city?.message}
            />
            <Input
              label="State"
              placeholder="Maharashtra"
              {...register('state', { required: 'Required' })}
              error={errors.state?.message}
            />
            <Input
              label="Country"
              placeholder="India"
              {...register('country', { required: 'Required' })}
              error={errors.country?.message}
            />
            <Input
              label="Pincode"
              placeholder="400051"
              {...register('pincode', { required: 'Required' })}
              error={errors.pincode?.message}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createCustomerMutation.isLoading || updateCustomerMutation.isLoading}>
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default CustomersPage
