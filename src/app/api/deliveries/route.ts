import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // TODO: Implement DeliveryService.getAllDeliveries()
        // Optional filters: status, shipperId, commuterId
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const shipperId = searchParams.get('shipperId');
        const commuterId = searchParams.get('commuterId');

        return NextResponse.json(
            {
                success: true,
                data: {
                    deliveries: [],
                    filters: { status, shipperId, commuterId },
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get deliveries error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
