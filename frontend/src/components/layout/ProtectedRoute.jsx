import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../common/LoadingSpinner'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-4">
        <div className="text-6xl">🚫</div>
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-slate-400">You don't have permission to access this page.</p>
        <button onClick={() => window.history.back()} className="btn-secondary">Go Back</button>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
