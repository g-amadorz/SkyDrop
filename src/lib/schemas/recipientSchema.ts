import { z } from 'zod'

export const recipientSchema = z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
})