import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FlaskConical, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const demoUsers = [
    { label: 'Student',         username: 'student1' },
    { label: 'Club Manager',    username: 'acm_manager' },
    { label: 'Lab Assistant',   username: 'lab_assist' },
    { label: 'Professor',       username: 'prof_sharma' },
    { label: 'Class Coord.',    username: 'cc_desai' },
    { label: 'HOD',             username: 'hod_kumar' },
    { label: 'Principal',       username: 'principal' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003580] to-[#1d4ed8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
            <FlaskConical className="w-9 h-9 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">PICT Lab Booking</h1>
          <p className="text-blue-200 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <input className="input-field" placeholder="Enter username"
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input-field pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 text-base">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">Register</Link>
          </p>

          {/* Demo quick-login */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">Quick login (demo)</p>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map(u => (
                <button key={u.username}
                  type="button"
                  onClick={() => setForm({ username: u.username, password: 'password123' })}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-left truncate">
                  {u.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">All passwords: <code>password123</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
