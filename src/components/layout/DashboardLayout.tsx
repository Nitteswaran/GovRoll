import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { useCompanyStore } from '@/store/company-store'
import { useSubscriptionStore } from '@/store/subscription-store'
import { Button } from '@/components/ui/button'
import logo from '@/assets/logo.png'
import {
  LayoutDashboard,
  Building2,
  Users,
  Calculator,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Calendar,
  Mail,
  AlertTriangle,
  BarChart3,
  Zap,
  History,
  Lock,
  ChevronDown,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { company, fetchCompany } = useCompanyStore()
  const { subscription, fetchSubscription, isPremium } = useSubscriptionStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchCompany(user.id)
      fetchSubscription(user.id)
    }
  }, [user, fetchCompany, fetchSubscription])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    })
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, premium: false },
    { path: '/dashboard/company', label: 'Company', icon: Building2, premium: false },
    { path: '/dashboard/employees', label: 'Employees', icon: Users, premium: false },
    { path: '/dashboard/payroll', label: 'Payroll', icon: Calculator, premium: false },
    { path: '/dashboard/submissions', label: 'Submissions', icon: FileText, premium: false },
    { path: '/dashboard/multi-company', label: 'Multi-Company', icon: Building2, premium: true, feature: 'multi-company' },
    { path: '/dashboard/scheduled-payroll', label: 'Scheduled Payroll', icon: Calendar, premium: true, feature: 'scheduled-payroll' },
    { path: '/dashboard/bulk-payslips', label: 'Bulk Payslips', icon: Mail, premium: true, feature: 'bulk-payslips' },
    { path: '/dashboard/anomaly-detection', label: 'Anomaly Detection', icon: AlertTriangle, premium: true, feature: 'anomaly-detection' },
    { path: '/dashboard/reports', label: 'Custom Reports', icon: BarChart3, premium: true, feature: 'custom-reports' },
    { path: '/dashboard/automation', label: 'Automation Rules', icon: Zap, premium: true, feature: 'automation-rules' },
    { path: '/dashboard/audit-logs', label: 'Audit Logs', icon: History, premium: true, feature: 'audit-logs' },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings, premium: false },
    { path: '/dashboard/rag', label: 'RAG Chat', icon: Sparkles, premium: false },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:static lg:translate-x-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:flex flex-col h-full shadow-lg lg:shadow-none`}
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

        <div className="p-4 border-b border-gray-200 space-y-3">
          {subscription && (
            <div className="flex items-center justify-between">
              <Badge variant={subscription.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                {subscription.subscription_tier.toUpperCase()}
              </Badge>
              {!isPremium() && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                  onClick={() => navigate('/dashboard/settings?upgrade=true')}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>
          )}
          {company && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{company.company_name}</p>
                      <p className="text-xs text-gray-500">{company.registration_number}</p>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => navigate('/dashboard/multi-company')}>
                    Switch Company
                  </DropdownMenuItem>
                  {isPremium() && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard/multi-company')}>
                      Manage Companies
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            const isLocked = item.premium && !isPremium()

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault()
                    toast({
                      title: 'Premium Feature',
                      description: `Upgrade to Premium to access ${item.label}`,
                    })
                  } else {
                    setSidebarOpen(false)
                  }
                }}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100'
                  } ${isLocked ? 'opacity-60' : ''}`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {isLocked && <Lock className="h-4 w-4" />}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-4 ml-auto">
            {subscription && (
              <Badge variant={subscription.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                {subscription.subscription_tier.toUpperCase()}
              </Badge>
            )}
            <span className="text-sm text-gray-600">{user?.email}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

