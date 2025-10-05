import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/database/mongoose';
import Delivery from '@/lib/database/models/Delivery';

export async function GET(request: NextRequest) {
    try {
        await connectMongo();
        
        const searchParams = request.nextUrl.searchParams;
        const accessPointId = searchParams.get('accessPointId');
        const destinationDirection = searchParams.get('destinationDirection');

        // Find all deliveries awaiting pickup
        let query: any = { status: 'awaiting-pickup' };
        
        if (accessPointId) {
            query.currentAccessPoint = accessPointId;
        }

        const packages = await Delivery.find(query)
            .populate('productId')
            .populate('shipperId')
            .populate('originAccessPoint')
            .populate('destinationAccessPoint')
            .populate('currentAccessPoint')
            .sort({ totalCost: -1 }); // Sort by highest earnings first

        return NextResponse.json(
            {
                success: true,
                data: {
                    packages,
                    count: packages.length,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get available packages error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
