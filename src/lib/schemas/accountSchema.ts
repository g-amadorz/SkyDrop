import { z } from "zod";

export const createAccountSchema = z.object({
    email: z.string,
    password: z.string,
})

export const updateAccountSchema = createAccountSchema.partial()

export type createAccountInput = z.infer<typeof createAccountSchema>
export type updateAccountInput = z.infer<typeof updateAccountSchema>
