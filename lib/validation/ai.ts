import { z } from "zod"

export const aiQuestionSchema = z.object({
  question: z.string().trim().min(2, "Question must be at least 2 characters."),
  groupId: z.string().trim().min(1, "Group id is required."),
  previousResponseId: z.string().trim().min(1).optional(),
})
