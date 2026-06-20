import { useForm } from 'react-hook-form'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { ROLE_LIST } from '../../constants/roles'

const ROLE_OPTIONS = ROLE_LIST.map((r) => ({
  value: r,
  label: r.replace(/_/g, ' '),
}))

const UserForm = ({ onSubmit, defaultValues = {}, isLoading = false, isEdit = false }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full Name"
        required
        placeholder="John Smith"
        error={errors.name?.message}
        {...register('name', {
          required: 'Name is required',
          minLength: { value: 2, message: 'Minimum 2 characters' },
          maxLength: { value: 100, message: 'Maximum 100 characters' },
        })}
      />

      <Input
        label="Email Address"
        type="email"
        required
        placeholder="john@company.com"
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
        })}
      />

      <Select
        label="Role"
        required
        options={ROLE_OPTIONS}
        placeholder="Select role..."
        error={errors.role?.message}
        {...register('role', { required: 'Role is required' })}
      />

      <Input
        label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
        type="password"
        required={!isEdit}
        placeholder={isEdit ? 'Enter new password...' : 'Min 8 chars, uppercase, number, symbol'}
        hint="Must contain uppercase, lowercase, digit, and special character (@$!%*?&)"
        error={errors.password?.message}
        {...register('password', {
          required: isEdit ? false : 'Password is required',
          validate: (val) => {
            if (!val && isEdit) return true
            return (
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(val) ||
              'Must contain uppercase, lowercase, digit, and special character'
            )
          },
        })}
      />

      {isEdit && (
        <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
          <input
            type="checkbox"
            id="isActive"
            className="w-4 h-4 rounded accent-primary-600"
            {...register('isActive')}
          />
          <label htmlFor="isActive" className="text-sm text-slate-300 cursor-pointer">
            Account is active
          </label>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  )
}

export default UserForm
