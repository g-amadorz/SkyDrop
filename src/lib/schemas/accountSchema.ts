import { z } from "zod";

export const createAccountSchema = z.object({
    email: z.string(),
    password: z.string().min(6),
    name: z.string().min(1),
    phone: z.string(),
    role: z.enum(['rider', 'sender', 'admin']).optional(),
})

export const updateAccountSchema = z.object({
    email: z.string().optional(),
    password: z.string().min(6).optional(),
    name: z.string().min(1).optional(),
    role: z.enum(['rider', 'sender', 'admin']).optional(),
    points: z.number().min(0).optional(),
})

export type createAccountInput = z.infer<typeof createAccountSchema>
export type updateAccountInput = z.infer<typeof updateAccountSchema>