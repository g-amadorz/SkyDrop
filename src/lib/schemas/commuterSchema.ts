import { z } from 'zod'

export const createCommuterSchema = z.object({
    account: z.string(),
    activeProductIds: z.array(z.string()).optional().default([]),
})

export const updateCommuterSchema = createCommuterSchema.partial()

export type createCommuterInput = z.infer<typeof createCommuterSchema>
export type updateCommuterInput = z.infer<typeof updateCommuterSchema>
