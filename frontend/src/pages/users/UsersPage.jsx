import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers'
import UserTable from '../../components/tables/UserTable'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import UserForm from '../../components/forms/UserForm'
import Button from '../../components/common/Button'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import { ROLE_LIST } from '../../constants/roles'

const ROLE_FILTER = [{ value: '', label: 'All Roles' }, ...ROLE_LIST.map((r) => ({ value: r, label: r.replace(/_/g, ' ') }))]

const UsersPage = () => {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState({ open: false, user: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })

  const { data, isLoading } = useUsers({ search, role: roleFilter || undefined, page, limit: 10 })
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const handleCreate = async (formData) => {
    await createUser.mutateAsync(formData)
    setCreateModal(false)
  }

  const handleUpdate = async (formData) => {
    const payload = { ...formData }
    if (!payload.password) delete payload.password
    await updateUser.mutateAsync({ id: editModal.user._id, data: payload })
    setEditModal({ open: false, user: null })
  }

  const handleDelete = async () => {
    await deleteUser.mutateAsync(deleteDialog.user._id)
    setDeleteDialog({ open: false, user: null })
  }

  const meta = data?.meta || {}

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{meta.total ?? 0} users in the system</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setCreateModal(true)}>Add User</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          id="search-users"
          placeholder="Search by name or email..."
          defaultValue={search}
          onSearch={(val) => { setSearch(val); setPage(1) }}
          className="sm:max-w-xs"
        />
        <Select
          options={ROLE_FILTER}
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          containerClassName="sm:max-w-56"
          placeholder={null}
        />
      </div>

      <div className="card">
        <UserTable
          data={data?.data || []}
          isLoading={isLoading}
          onEdit={(u) => setEditModal({ open: true, user: u })}
          onDelete={(u) => setDeleteDialog({ open: true, user: u })}
        />
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <p className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={!meta.hasPrevPage}>Previous</Button>
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={!meta.hasNextPage}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create User">
        <UserForm onSubmit={handleCreate} isLoading={createUser.isPending} />
      </Modal>

      <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, user: null })} title="Edit User">
        {editModal.user && (
          <UserForm
            onSubmit={handleUpdate}
            defaultValues={{ ...editModal.user, password: '' }}
            isLoading={updateUser.isPending}
            isEdit
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
        onConfirm={handleDelete}
        title="Deactivate User"
        message={`Are you sure you want to deactivate "${deleteDialog.user?.name}"? They will lose access to the system.`}
        confirmLabel="Deactivate"
        isLoading={deleteUser.isPending}
      />
    </div>
  )
}

export default UsersPage
