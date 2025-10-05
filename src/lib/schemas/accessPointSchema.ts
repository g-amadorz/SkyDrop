import { z } from 'zod'

export const createAccessPointSchema = z.object({
    name: z.string(),
    nearestStation: z.string(),
    stationId: z.string(),
    account: z.string(),
    lat: z.number(),
    lng: z.number(),
})

export const updateAccessPointSchema = createAccessPointSchema.partial()

export type createAccessPointInput = z.infer<typeof createAccessPointSchema>
export type updateAccessPointInput = z.infer<typeof updateAccessPointSchema>