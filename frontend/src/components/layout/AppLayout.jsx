import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Calendar, PlusCircle, ClipboardList,
  CheckSquare, FlaskConical, LogOut, Menu, X, Bell, ChevronDown, BookOpen
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',       icon: LayoutDashboard, roles: null },
  { to: '/schedule',     label: 'Lab Schedule',    icon: Calendar,        roles: null },
  { to: '/book',         label: 'Book a Lab',      icon: PlusCircle,      roles: ['STUDENT','CLUB_MANAGER'] },
  { to: '/my-bookings',  label: 'My Bookings',     icon: ClipboardList,   roles: ['STUDENT','CLUB_MANAGER'] },
  { to: '/approvals',    label: 'Approvals',       icon: CheckSquare,     roles: ['LAB_ASSISTANT','PROFESSOR','CLASS_COORDINATOR','HOD','PRINCIPAL','CLUB_MANAGER'] },
  { to: '/all-bookings', label: 'All Bookings',    icon: BookOpen,        roles: ['HOD','PRINCIPAL','LAB_ASSISTANT'] },
]

export default function AppLayout() {
  const { user, logout, hasAnyRole } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleNav = NAV_ITEMS.filter(item =>
    !item.roles || hasAnyRole(...item.roles)
  )

  const roleLabel = user?.roles?.[0]?.replace('_', ' ') ?? 'User'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={clsx(
        'flex flex-col bg-[#003580] text-white transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-blue-700">
          <FlaskConical className="w-8 h-8 text-yellow-400 shrink-0" />
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="font-bold text-sm leading-tight">PICT Lab Booking</p>
              <p className="text-blue-300 text-xs">Management System</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-100 hover:bg-blue-700/60 hover:text-white'
              )}>
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="flex items-center justify-center h-12 border-t border-blue-700 hover:bg-blue-700 transition-colors">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">PICT Lab Booking System</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell className="w-5 h-5" />
            </button>
            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.fullName?.[0] ?? 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 capitalize">{roleLabel}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
