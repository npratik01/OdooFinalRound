import { AlertTriangle, CheckCircle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

/**
 * ConfirmDialog — Generic confirmation modal.
 * Variants: 'danger' (red), 'primary' (blue/indigo), 'success' (green)
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconConfig = {
    danger:  { Icon: AlertTriangle, bg: 'bg-red-500/10',     color: 'text-red-400' },
    primary: { Icon: CheckCircle,   bg: 'bg-primary-500/10', color: 'text-primary-400' },
    success: { Icon: CheckCircle,   bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
  }

  const { Icon, bg, color } = iconConfig[variant] || iconConfig.danger

  const btnVariantMap = {
    danger:  'danger',
    primary: 'primary',
    success: 'success',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bg}`}>
          <Icon className={color} size={28} />
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 w-full mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={btnVariantMap[variant] || 'primary'}
            className="flex-1"
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
