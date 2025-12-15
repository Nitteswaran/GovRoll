import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'
import { useSubscriptionStore } from '@/store/subscription-store'
import { useToast } from '@/hooks/use-toast'
import { createCheckoutSession, createPortalSession, stripePromise, STRIPE_PRICE_PREMIUM } from '@/lib/stripe'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pricing } from '@/components/ui/pricing'

export function SettingsPage() {
  const { user } = useAuthStore()
  const { subscription, fetchSubscription, isPremium } = useSubscriptionStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (user) {
      fetchSubscription(user.id)
    }
  }, [user, fetchSubscription])

  useEffect(() => {
    if (searchParams.get('success')) {
      toast({
        title: 'Payment Successful',
        description: 'Your subscription has been upgraded to Premium!',
      })
      if (user) {
        fetchSubscription(user.id)
      }
      // Clean up the URL
      searchParams.delete('success')
      setSearchParams(searchParams)
    }
  }, [searchParams, toast, user, fetchSubscription, setSearchParams])

  const handleUpgrade = async () => {
    if (!STRIPE_PRICE_PREMIUM) {
      toast({
        title: 'Error',
        description: 'Stripe is not configured',
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

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const url = await createPortalSession()
      window.location.href = url
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to open portal',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const plans = [
    {
      name: "STARTER",
      price: "0",
      yearlyPrice: "0",
      period: "per month",
      features: [
        "Basic analytics",
        "Up to 1 company",
        "Up to 5 employees",
        "Community support",
      ],
      description: "Perfect for individuals and small projects",
      buttonText: isPremium() ? "Current Plan" : "Current Plan",
      href: "#",
      isPopular: false,
    },
    {
      name: "PREMIUM",
      price: "79",
      yearlyPrice: "63", // approx 20% off
      period: "per month",
      features: [
        "Unlimited AI Questions",
        "Unlimited Companies",
        "Unlimited Employees",
        "Automated Payroll",
        "Advanced Reports",
        "Audit Logs",
        "Priority Support",
      ],
      description: "Ideal for growing teams and businesses",
      buttonText: isPremium() ? "Manage Subscription" : "Upgrade to Premium",
      action: isPremium() ? handleManageSubscription : handleUpgrade,
      isPopular: true,
    },
  ];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings</p>
      </div>

      <Pricing
        plans={plans}
        title="Simple, Transparent Pricing"
        description="Choose the plan that works for you"
      />

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="userId">User ID</Label>
            <Input id="userId" value={user?.id || ''} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Application preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Preferences settings coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

