import { NextRequest, NextResponse } from 'next/server';
import { dropoffPackageSchema } from '@/lib/schemas/deliverySchema';
import DeliveryService from '@/lib/services/deliveryService';
import { connectMongo } from '@/lib/database/mongoose';

export async function POST(request: NextRequest) {
    try {
        await connectMongo();
        
        const body = await request.json();
        const validatedData = dropoffPackageSchema.parse(body);

        const deliveryService = new DeliveryService();
        const result = await deliveryService.dropoffPackage(
            validatedData.commuterId,
            validatedData.deliveryId,
            validatedData.accessPointId,
            0 // Distance will be calculated from station hops
        );

        return NextResponse.json(
            {
                success: true,
                message: 'Package dropped off successfully',
                data: result,
            },
            { status: 200 }
        );
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Dropoff package error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
