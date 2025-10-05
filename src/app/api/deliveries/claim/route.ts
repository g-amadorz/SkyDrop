import { NextRequest, NextResponse } from 'next/server';
import { claimPackageSchema } from '@/lib/schemas/deliverySchema';
import DeliveryService from '@/lib/services/deliveryService';
import { connectMongo } from '@/lib/database/mongoose';

export async function POST(request: NextRequest) {
    try {
        await connectMongo();
        
        const body = await request.json();
        const validatedData = claimPackageSchema.parse(body);

        const deliveryService = new DeliveryService();
        const result = await deliveryService.claimPackage(
            validatedData.commuterId,
            validatedData.deliveryId
        );

        return NextResponse.json(
            {
                success: true,
                message: 'Package claimed successfully',
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

        console.error('Claim package error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
