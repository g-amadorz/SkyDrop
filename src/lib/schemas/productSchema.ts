import { z } from 'zod'
import { recipientSchema } from './recipientSchema'

export const createProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Description is required'),
    sender: z.string(), // User ID
    destinationAccessPoint: z.string(), // AccessPoint ID
    currentLocation: z.string(), // AccessPoint ID where package starts
    recipient: recipientSchema,
})

export const updateProductSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    sender: z.string().optional(),
    destinationAccessPoint: z.string().optional(),
    currentLocation: z.string().optional(),
    status: z.enum(['pending', 'in-transit', 'delivered', 'cancelled']).optional(),
    recipient: recipientSchema.optional(),
})

export type createProductInput = z.infer<typeof createProductSchema>
export type updateProductInput = z.infer<typeof updateProductSchema>




