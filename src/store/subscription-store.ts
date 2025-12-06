import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export type SubscriptionTier = 'free' | 'pro' | 'premium'

export interface Subscription {
  id: string
  user_id: string
  subscription_tier: SubscriptionTier
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_price_id?: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

interface SubscriptionState {
  subscription: Subscription | null
  loading: boolean
  setSubscription: (subscription: Subscription | null) => void
  setLoading: (loading: boolean) => void
  fetchSubscription: (userId: string) => Promise<void>
  isPremium: () => boolean
  isPro: () => boolean
  canAccessFeature: (feature: string) => boolean
}

const PREMIUM_FEATURES = [
  'multi-company',
  'scheduled-payroll',
  'bulk-payslips',
  'anomaly-detection',
  'custom-reports',
  'automation-rules',
  'audit-logs',
]

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  loading: false,
  setSubscription: (subscription) => set({ subscription }),
  setLoading: (loading) => set({ loading }),
  fetchSubscription: async (userId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        // Create free subscription if none exists
        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            subscription_tier: 'free',
            status: 'active',
          })
          .select()
          .single()

        if (insertError) throw insertError
        set({ subscription: newSub as Subscription, loading: false })
      } else {
        set({ subscription: data as Subscription, loading: false })
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      set({ subscription: null, loading: false })
    }
  },
  isPremium: () => {
    const sub = get().subscription
    return sub?.subscription_tier === 'premium' && sub?.status === 'active'
  },
  isPro: () => {
    const sub = get().subscription
    return (sub?.subscription_tier === 'pro' || sub?.subscription_tier === 'premium') && sub?.status === 'active'
  },
  canAccessFeature: (feature: string) => {
    if (!PREMIUM_FEATURES.includes(feature)) return true
    return get().isPremium()
  },
}))

