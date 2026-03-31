import { getBillingPlan } from "./plans"
import type { BillingPlan, Group } from "../types"

function formatLimit(limit: number | null) {
  return limit === null ? "unlimited" : String(limit)
}

export function getSeatLimitMessage(plan: BillingPlan) {
  const definition = getBillingPlan(plan)
  return `${definition.name} allows up to ${formatLimit(definition.limits.maxSeats)} seats. Upgrade the workspace plan to add more people.`
}

export function getRecurringLimitMessage(plan: BillingPlan) {
  const definition = getBillingPlan(plan)
  return `${definition.name} allows up to ${formatLimit(definition.limits.maxRecurringPlans)} recurring plans. Upgrade the workspace plan to create more.`
}

export function canAddSeat(group: Group, plan: BillingPlan) {
  const limit = getBillingPlan(plan).limits.maxSeats
  if (limit === null) {
    return true
  }

  return (group.memberEmails?.length ?? 0) < limit
}

export function canCreateRecurringPlan(group: Group, plan: BillingPlan) {
  const limit = getBillingPlan(plan).limits.maxRecurringPlans
  if (limit === null) {
    return true
  }

  return (group.recurringTransactions?.length ?? 0) < limit
}
