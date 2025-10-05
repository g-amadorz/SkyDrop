import { z } from 'zod'
import { recipientSchema } from './recipientSchema'
export const createProductSchema = z.object({
    name: z.string(),
    description: z.string(),

    recipient: recipientSchema,

})

export const updateProductSchema = createProductSchema.partial()

export type createProductInput = z.infer<typeof createProductSchema>
export type updateProductInput = z.infer<typeof updateProductSchema>




