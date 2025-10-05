
export async function POST(request: NextRequest) {
    try {
        await connectMongo();
        const body = await request.json();
        // Validate input (basic, for now)
        const { productId, shipperId, originAccessPoint, destinationAccessPoint } = body;
        if (!productId || !shipperId || !originAccessPoint || !destinationAccessPoint) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }
        const deliveryService = new DeliveryService();
    const delivery = await deliveryService.initiateDelivery(shipperId, { productId, shipperId, originAccessPoint, destinationAccessPoint });
        return NextResponse.json({ success: true, data: delivery }, { status: 201 });
    } catch (error: any) {
        console.error('Create delivery error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/database/mongoose';
import DeliveryService from '@/lib/services/deliveryService';

export async function GET(request: NextRequest) {
    try {
        await connectMongo();
        
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const shipperId = searchParams.get('shipperId');
        const commuterId = searchParams.get('commuterId');

        const deliveryService = new DeliveryService();
        let deliveries;

        if (shipperId) {
            deliveries = await deliveryService.getShipperDeliveries(shipperId, status || undefined);
        } else if (commuterId) {
            deliveries = await deliveryService.getCommuterActiveDeliveries(commuterId);
        } else {
            deliveries = await deliveryService.getAllDeliveries();
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    deliveries,
                    filters: { status, shipperId, commuterId },
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get deliveries error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
