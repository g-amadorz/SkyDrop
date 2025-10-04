import { z } from 'zod'

export const createProductSchema = z.object({
    name: z.string(),
    description: z.string(),
    destination: z.string(),
})

export const updateProductSchema = createProductSchema.partial()

export type createProductInput = z.infer<typeof createProductSchema>
export type updateProductInput = z.infer<typeof updateProductSchema>