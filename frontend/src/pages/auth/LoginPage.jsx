import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Lock, Mail, Activity } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import AlertBanner from '../../components/common/AlertBanner'

const LoginPage = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', password: '' },
  })

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data) => {
    setAuthError(null)
    setIsSubmitting(true)
    try {
      await login(data.email, data.password)
    } catch (err) {
      setAuthError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-900 via-slate-900 to-indigo-950 flex-col items-center justify-center p-12">
        {/* Decorative orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary-500/30">
            <Activity size={36} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Mini ERP System
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Enterprise resource planning for modern manufacturing companies.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-12">
            {[
              { value: 'Phase 1', label: 'Live Now' },
              { value: 'RBAC', label: 'Role-Based Access' },
              { value: 'Real-time', label: 'Inventory Alerts' },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-primary-300 font-bold text-lg">{item.value}</p>
                <p className="text-slate-500 text-xs mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Mini ERP System</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">Sign in to your account to continue</p>
          </div>

          {authError && (
            <AlertBanner
              variant="error"
              title="Authentication Failed"
              message={authError}
              dismissible
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="email"
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="admin@erp.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
              })}
            />

            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="hover:text-slate-200 transition-colors pointer-events-auto"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-8 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Demo Credentials
            </p>
            <div className="space-y-2">
              {[
                { label: 'Admin', email: 'admin@erp.com', pass: 'Admin@1234' },
                { label: 'Business Owner', email: 'owner@erp.com', pass: 'Owner@1234' },
                { label: 'Inventory Mgr', email: 'inventory@erp.com', pass: 'Inv@1234' },
              ].map((c) => (
                <div key={c.email} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{c.label}</span>
                  <span className="font-mono text-slate-400">{c.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
