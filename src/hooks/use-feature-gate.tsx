import { ReactNode } from 'react'
import { useSubscriptionStore } from '@/store/subscription-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Lock, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCheckoutSession, stripePromise } from '@/lib/stripe'
import { STRIPE_PRICE_PREMIUM } from '@/lib/stripe'
import { useToast } from '@/hooks/use-toast'

interface FeatureGateProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { canAccessFeature, isPremium } = useSubscriptionStore()
  const hasAccess = canAccessFeature(feature)

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return <PremiumLocked feature={feature} />
}

export function PremiumLocked({ feature }: { feature: string }) {
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const featureNames: Record<string, string> = {
    'multi-company': 'Multi-Company Management',
    'scheduled-payroll': 'Auto Payroll Scheduling',
    'bulk-payslips': 'Bulk Payslip Distribution',
    'anomaly-detection': 'Anomaly Detection',
    'custom-reports': 'Custom Reports',
    'automation-rules': 'Automation Rules',
    'audit-logs': 'Audit Logs',
  }

  const handleUpgrade = async () => {
    if (!STRIPE_PRICE_PREMIUM) {
      toast({
        title: 'Error',
        description: 'Stripe is not configured. Please contact support.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const sessionId = await createCheckoutSession(STRIPE_PRICE_PREMIUM)
      const stripe = await stripePromise
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start checkout',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="p-4 rounded-full bg-gray-100">
          <Lock className="h-12 w-12 text-gray-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Premium Feature</h3>
          <p className="text-gray-600 max-w-md">
            {featureNames[feature] || 'This feature'} is available for Premium
            subscribers only.
          </p>
        </div>
        <Button onClick={() => setUpgradeDialogOpen(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          Upgrade to Premium
        </Button>
      </div>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Premium</DialogTitle>
            <DialogDescription>
              Unlock all premium features including {featureNames[feature] || 'this feature'} for just RM79/month.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Premium Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Multi-Company Management</li>
                <li>Auto Payroll Scheduling</li>
                <li>Bulk Payslip Distribution</li>
                <li>Anomaly Detection</li>
                <li>Custom Reports</li>
                <li>Automation Rules</li>
                <li>Audit Logs & History</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={loading}>
              {loading ? 'Processing...' : 'Upgrade Now - RM79/month'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function useFeatureGate(feature: string) {
  const { canAccessFeature, isPremium } = useSubscriptionStore()
  return {
    hasAccess: canAccessFeature(feature),
    isPremium,
  }
}

