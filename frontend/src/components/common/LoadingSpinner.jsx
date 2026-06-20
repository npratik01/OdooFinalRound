const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
}

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  return (
    <div
      className={`
        ${sizeMap[size]}
        rounded-full
        border-primary-600
        border-t-transparent
        animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  )
}

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner size="xl" />
      <p className="text-slate-400 text-sm animate-pulse">Loading...</p>
    </div>
  </div>
)

export default LoadingSpinner
