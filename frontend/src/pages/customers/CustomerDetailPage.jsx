import { useParams, Link } from 'react-router-dom'
import { useCustomer } from '../../hooks/useCustomers'
import { useSalesOrders } from '../../hooks/useSales'
import { ArrowLeft, User, Phone, Mail, MapPin, ShieldAlert, FileText } from 'lucide-react'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import DataTable from '../../components/tables/DataTable'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { ROUTES } from '../../constants/routes'

const CustomerDetailPage = () => {
  const { id } = useParams()
  const { data: customer, isLoading: isLoadingCustomer } = useCustomer(id)
  const { data: salesData, isLoading: isLoadingSales } = useSalesOrders({ customerId: id })

  if (isLoadingCustomer || isLoadingSales) return <LoadingSpinner />

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Customer Not Found</h2>
        <p className="text-slate-400 mb-6">The customer you are trying to view does not exist or has been deleted.</p>
        <Link to="/customers">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Directory
          </Button>
        </Link>
      </div>
    )
  }

  const salesColumns = [
    {
      header: 'SO Number',
      accessor: 'soNumber',
      render: (val, row) => (
        <Link to={`/sales/${row._id}`} className="font-mono text-primary-400 hover:underline font-semibold">
          {val}
        </Link>
      ),
    },
    {
      header: 'Order Date',
      accessor: 'orderDate',
      render: (val) => formatDateTime(val),
    },
    {
      header: 'Items Count',
      accessor: 'items',
      render: (items) => <span className="text-slate-300">{items?.length || 0} items</span>,
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      render: (val) => <span className="font-semibold text-slate-100">{formatCurrency(val)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status) => {
        let color = 'slate'
        if (status === 'Draft') color = 'slate'
        if (status === 'Confirmed') color = 'indigo'
        if (status === 'Partially Delivered') color = 'amber'
        if (status === 'Fully Delivered') color = 'emerald'
        if (status === 'Cancelled') color = 'red'
        return <Badge color={color} size="sm">{status}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/customers">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 flex items-center justify-center rounded-xl">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <span className="text-xs font-mono text-primary-400 font-semibold">{customer.customerCode}</span>
          <h1 className="text-2xl font-bold text-white tracking-tight">{customer.customerName}</h1>
        </div>
      </div>

      {/* Grid of Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center text-primary-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Customer Profile</h2>
              <p className="text-xs text-slate-500">Static registry information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-slate-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Email Address</p>
                <p className="text-sm text-slate-200 break-all">{customer.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={16} className="text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Phone Number</p>
                <p className="text-sm text-slate-200">{customer.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText size={16} className="text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">GST Registration Number</p>
                <p className="text-sm text-slate-200 font-mono">{customer.gstNumber || 'Unregistered'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t border-slate-800">
              <MapPin size={16} className="text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Billing Address</p>
                <p className="text-sm text-slate-200">{customer.address}</p>
                <p className="text-sm text-slate-400">{customer.city}, {customer.state}</p>
                <p className="text-xs text-slate-500">{customer.country} — {customer.pincode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Order History */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="font-semibold text-white">Sales Order History</h2>
            <Badge color="primary">{salesData?.orders?.length || 0} Orders</Badge>
          </div>

          {!salesData?.orders || salesData.orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">No orders created for this customer yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <DataTable
                data={salesData.orders}
                columns={salesColumns}
                onPageChange={() => {}} // Simple history table: pagination is clientside or simple
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerDetailPage
