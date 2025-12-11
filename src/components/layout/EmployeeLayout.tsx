import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import logo from '@/assets/logo.png'
import { LayoutDashboard, Clock, Calendar, FileText, User, Folder, LogOut, Menu, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EmployeeLayoutProps {
  children: React.ReactNode
}

export function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toast } = useToast()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    })
  }

  const navItems = [
    { path: '/employee', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employee/attendance', label: 'Attendance', icon: Clock },
    { path: '/employee/payslips', label: 'Payslips', icon: FileText },
    { path: '/employee/leave', label: 'Leave', icon: Calendar },
    { path: '/employee/documents', label: 'Documents', icon: Folder },
    { path: '/employee/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:static lg:translate-x-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:flex flex-col h-full`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:justify-center">
          <img src={logo} alt="GovRoll" className="h-16 w-auto" />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto text-sm text-gray-600">{user?.email}</div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
