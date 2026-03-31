import type { BillingLimits, BillingPlan } from "@/lib/types"

export interface BillingPlanDefinition {
  id: BillingPlan
  name: string
  description: string
  priceMonthly: number
  limits: BillingLimits
  highlights: string[]
}

export const BILLING_PLANS: Record<BillingPlan, BillingPlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "For early teams validating a shared finance workflow.",
    priceMonthly: 19,
    limits: {
      maxSeats: 5,
      maxPendingInvites: 5,
      maxRecurringPlans: 10,
    },
    highlights: [
      "Up to 5 workspace seats",
      "10 recurring plans",
      "Core exports and monthly reports",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    description: "For active teams running recurring contributions and shared operations.",
    priceMonthly: 79,
    limits: {
      maxSeats: 20,
      maxPendingInvites: 20,
      maxRecurringPlans: 100,
    },
    highlights: [
      "Up to 20 workspace seats",
      "100 recurring plans",
      "Operational notifications and access controls",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    description: "For larger organizations that need broad access and fewer operational limits.",
    priceMonthly: 199,
    limits: {
      maxSeats: null,
      maxPendingInvites: null,
      maxRecurringPlans: null,
    },
    highlights: [
      "Unlimited seats",
      "Unlimited recurring plans",
      "Best fit for larger finance operations",
    ],
  },
}

export function getBillingPlan(plan: BillingPlan) {
  return BILLING_PLANS[plan]
}
