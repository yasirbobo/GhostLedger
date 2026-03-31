import { z } from "zod"

export const notificationPreferencesSchema = z.object({
  monthlySummary: z.boolean(),
  budgetAlerts: z.boolean(),
  recurringReminders: z.boolean(),
  inviteUpdates: z.boolean(),
})
