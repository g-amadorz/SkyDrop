import { z } from 'zod'

export const createShipperSchema = z.object({
    account: z.string(),
    activeProductIds: z.array(z.string()).optional().default([]),
})

export const updateShipperSchema = createShipperSchema.partial()

export type createShipperInput = z.infer<typeof createShipperSchema>
export type updateShipperInput = z.infer<typeof updateShipperSchema>
