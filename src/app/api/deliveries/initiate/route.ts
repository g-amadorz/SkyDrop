import { NextRequest, NextResponse } from 'next/server';
import { initiateDeliverySchema } from '@/lib/schemas/deliverySchema';
import DeliveryService from '@/lib/services/deliveryService';
import { connectMongo } from '@/lib/database/mongoose';

export async function POST(request: NextRequest) {
    try {
        await connectMongo();
        
        const body = await request.json();
        const validatedData = initiateDeliverySchema.parse(body);

        const deliveryService = new DeliveryService();
        const delivery = await deliveryService.initiateDelivery(
            validatedData.shipperId,
            validatedData
        );

        return NextResponse.json(
            {
                success: true,
                message: 'Delivery initiated successfully',
                data: delivery,
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Initiate delivery error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
