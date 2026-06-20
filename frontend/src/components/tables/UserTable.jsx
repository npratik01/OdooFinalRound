import { useNavigate } from 'react-router-dom'
import { Eye, Edit2, Trash2 } from 'lucide-react'
import DataTable from './DataTable'
import Badge from '../common/Badge'
import { formatDate, timeAgo } from '../../utils/formatters'
import { buildRoute } from '../../constants/routes'
import { ROLE_LABELS } from '../../constants/roles'

const UserTable = ({ data, isLoading, onEdit, onDelete }) => {
  const navigate = useNavigate()

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {val?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white">{val}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <Badge variant="purple">{ROLE_LABELS[val] || val}</Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => <Badge variant={val ? 'active' : 'inactive'}>{val ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (val) => <span className="text-slate-400 text-xs">{val ? timeAgo(val) : 'Never'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (val) => <span className="text-slate-400 text-xs">{formatDate(val)}</span>,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(buildRoute.userDetail(row._id))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
            title="View"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => onEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            title="Edit"
          >
            <Edit2 size={15} />
          </button>
          {row.isActive && (
            <button
              onClick={() => onDelete(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Deactivate"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyTitle="No users found"
      emptyDescription="Create the first user to get started."
    />
  )
}

export default UserTable
