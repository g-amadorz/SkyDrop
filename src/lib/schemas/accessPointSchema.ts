import { z } from 'zod'

const createAccessPointSchema = z.object({
    name: z.string(),
    location: z.string(),
    email: z.string()
})

const updateAccessPointSchema = createAccessPointSchema.partial()

export type createAccessPointInput = z.infer<typeof createAccessPointSchema>
export type updateAccessPointInput = z.infer<typeof updateAccessPointSchema>