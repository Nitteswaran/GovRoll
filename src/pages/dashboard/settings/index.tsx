import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth-store'
import { useSubscriptionStore } from '@/store/subscription-store'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, CreditCard } from 'lucide-react'
import { createCheckoutSession, createPortalSession, stripePromise, STRIPE_PRICE_PREMIUM } from '@/lib/stripe'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Plan</p>
              <Badge variant={isPremium() ? 'default' : 'secondary'} className="mt-2">
                {subscription?.subscription_tier?.toUpperCase() || 'FREE'}
              </Badge>
            </div>
            {!isPremium() ? (
              <Button onClick={handleUpgrade} disabled={loading}>
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            ) : (
              <Button variant="outline" onClick={handleManageSubscription} disabled={loading}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            )}
          </div>
          {subscription && subscription.current_period_end && (
            <div className="text-sm text-gray-600">
              {subscription.cancel_at_period_end
                ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
            </div>
          )}
        </CardContent>
      </Card>

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

