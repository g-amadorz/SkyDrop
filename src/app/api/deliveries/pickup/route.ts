import { NextRequest, NextResponse } from 'next/server';
import { recipientPickupSchema } from '@/lib/schemas/deliverySchema';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = recipientPickupSchema.parse(body);

        // TODO: Implement DeliveryService.recipientPickup()
        // const deliveryService = new DeliveryService();
        // const result = await deliveryService.recipientPickup(validatedData);

        return NextResponse.json(
            {
                success: true,
                message: 'Package picked up by recipient successfully',
                data: validatedData,
            },
            { status: 200 }
        );
    } catch (error) {
        if ((error as any).name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: (error as any).errors },
                { status: 400 }
            );
        }

        console.error('Recipient pickup error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
