import { z } from 'zod'

export const createAccessPointSchema = z.object({
    name: z.string(),
    location: z.string(),
    account: z.string()
})

export const updateAccessPointSchema = createAccessPointSchema.partial()

export type createAccessPointInput = z.infer<typeof createAccessPointSchema>
export type updateAccessPointInput = z.infer<typeof updateAccessPointSchema>