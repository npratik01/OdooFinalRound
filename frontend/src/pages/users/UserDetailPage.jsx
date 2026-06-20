import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import UserForm from '../../components/forms/UserForm'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { formatDateTime, timeAgo } from '../../utils/formatters'
import { ROLE_LABELS } from '../../constants/roles'

const UserDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editModal, setEditModal] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const { data: user, isLoading } = useUser(id)
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  if (isLoading) return <PageLoader />
  if (!user) return <div className="text-slate-400 p-6">User not found</div>

  const handleUpdate = async (formData) => {
    const payload = { ...formData }
    if (!payload.password) delete payload.password
    await updateUser.mutateAsync({ id, data: payload })
    setEditModal(false)
  }

  const handleDeactivate = async () => {
    await deleteUser.mutateAsync(id)
    setDeleteDialog(false)
    navigate('/users')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to Users
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-slate-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="purple">{ROLE_LABELS[user.role] || user.role}</Badge>
                <Badge variant={user.isActive ? 'active' : 'inactive'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" leftIcon={<Edit2 size={14} />} onClick={() => setEditModal(true)}>Edit</Button>
            {user.isActive && (
              <Button size="sm" variant="danger" onClick={() => setDeleteDialog(true)}>Deactivate</Button>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-white text-sm border-b border-slate-700 pb-3">User Details</h2>
        {[
          ['Full Name', user.name],
          ['Email Address', user.email],
          ['Role', ROLE_LABELS[user.role] || user.role],
          ['Account Status', user.isActive ? 'Active' : 'Inactive'],
          ['Last Login', user.lastLogin ? timeAgo(user.lastLogin) : 'Never'],
          ['Created At', formatDateTime(user.createdAt)],
          ['Last Updated', formatDateTime(user.updatedAt)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-200 font-medium">{value}</span>
          </div>
        ))}
      </div>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit User">
        <UserForm
          onSubmit={handleUpdate}
          defaultValues={{ ...user, password: '' }}
          isLoading={updateUser.isPending}
          isEdit
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDeactivate}
        title="Deactivate User"
        message={`Deactivate "${user.name}"? They will lose all system access.`}
        confirmLabel="Deactivate"
        isLoading={deleteUser.isPending}
      />
    </div>
  )
}

export default UserDetailPage
