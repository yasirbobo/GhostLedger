import { z } from "zod"

export const updateBillingPlanSchema = z.object({
  groupId: z.string().trim().min(1, "groupId is required."),
  plan: z.enum(["starter", "growth", "scale"]),
})
