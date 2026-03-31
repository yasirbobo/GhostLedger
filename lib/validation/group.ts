import { z } from "zod"

const trimmedRequiredString = (label: string) =>
  z.string().trim().min(1, `${label} is required.`)

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters."),
  memberNames: z
    .array(z.string().trim().min(1, "Member name is required."))
    .transform((memberNames) => memberNames.filter(Boolean))
    .refine((memberNames) => memberNames.length > 0, {
      message: "Add at least one team member.",
    }),
  budgetMonthly: z
    .number()
    .finite("Monthly budget must be a valid number.")
    .min(0, "Monthly budget cannot be negative."),
})

export const updateGroupSchema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters."),
  budgetMonthly: z
    .number()
    .finite("Monthly budget must be a valid number.")
    .min(0, "Monthly budget cannot be negative."),
})

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid invite email."),
  role: z.enum(["admin", "member", "viewer"]).optional().default("member"),
})

export const updateMemberAccessSchema = z.object({
  email: z.string().trim().email("Enter a valid member email."),
  role: z.enum(["admin", "member", "viewer"]),
})

export const removeMemberAccessSchema = z.object({
  email: z.string().trim().email("Enter a valid member email."),
})

const recurrenceSchema = z.object({
  frequency: z.enum(["weekly", "monthly"]),
  nextRunDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Next run date must be a valid date."),
})

export const addTransactionSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(2, "Description must be at least 2 characters."),
    amount: z.number().finite("Amount must be a valid number.").positive("Amount must be greater than zero."),
    type: z.enum(["contribution", "expense"]),
    memberId: trimmedRequiredString("Member"),
    memberName: trimmedRequiredString("Member name"),
    isPrivate: z.boolean().optional().default(false),
    category: z.string().trim().optional(),
    recurrence: recurrenceSchema.optional(),
  })
  .transform((data) => ({
    ...data,
    category: data.type === "contribution" ? "Contribution" : data.category?.trim() ?? "",
  }))
  .refine((data) => data.type === "contribution" || data.category.length > 0, {
    message: "Category is required for expenses.",
    path: ["category"],
  })

export const updateTransactionSchema = addTransactionSchema
