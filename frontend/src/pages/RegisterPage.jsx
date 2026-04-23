import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../api'
import toast from 'react-hot-toast'
import { FlaskConical } from 'lucide-react'

const ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'CLUB_MANAGER', label: 'Club Manager' },
  { value: 'LAB_ASSISTANT', label: 'Lab Assistant' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'CLASS_COORDINATOR', label: 'Class Coordinator' },
  { value: 'HOD', label: 'HOD' },
  { value: 'PRINCIPAL', label: 'Principal' },
]
const CLUBS = ['PICT ACM', 'PICT IEEE', 'PICT INC']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    username: '', password: '', email: '', fullName: '',
    phoneNumber: '', division: '', clubName: '', department: '', roles: ['STUDENT'],
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const isClub = form.roles.includes('CLUB_MANAGER')
  const isStudent = form.roles.includes('STUDENT')

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.register({ ...form, roles: form.roles })
      toast.success('Registration successful! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003580] to-[#1d4ed8] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <FlaskConical className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-blue-200 text-sm">PICT Lab Booking System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input-field" required value={form.fullName}
                  onChange={e => set('fullName', e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <label className="label">Username</label>
                <input className="input-field" required value={form.username}
                  onChange={e => set('username', e.target.value)} placeholder="johndoe" />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input className="input-field" type="email" required value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="you@pict.edu" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Password</label>
                <input className="input-field" type="password" required
                  minLength={6} value={form.password}
                  onChange={e => set('password', e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input-field" value={form.phoneNumber}
                  onChange={e => set('phoneNumber', e.target.value)} placeholder="9876543210" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Role</label>
                <select className="input-field" value={form.roles[0]}
                  onChange={e => set('roles', [e.target.value])}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Department</label>
                <input className="input-field" value={form.department}
                  onChange={e => set('department', e.target.value)} placeholder="Computer Engineering" />
              </div>
            </div>

            {isStudent && (
              <div>
                <label className="label">Division (e.g. TE-A)</label>
                <input className="input-field" value={form.division}
                  onChange={e => set('division', e.target.value)} placeholder="TE-A" />
              </div>
            )}

            {isClub && (
              <div>
                <label className="label">Club</label>
                <select className="input-field" value={form.clubName}
                  onChange={e => set('clubName', e.target.value)}>
                  <option value="">Select club</option>
                  {CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
