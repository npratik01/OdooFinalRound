import { forwardRef } from 'react'
import LoadingSpinner from './LoadingSpinner'

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

const variantClasses = {
  primary: 'bg-primary-600 hover:bg-primary-500 text-white focus:ring-primary-500',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500',
  danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500',
  ghost: 'bg-transparent hover:bg-slate-700 text-slate-300 hover:text-white focus:ring-slate-500',
  outline: 'bg-transparent border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white focus:ring-slate-500',
}

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,      // alias for isLoading
  disabled = false,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const showSpinner = isLoading || loading
  return (
    <button
      ref={ref}
      disabled={disabled || showSpinner}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {showSpinner ? (
        <LoadingSpinner size="sm" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !showSpinner && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
