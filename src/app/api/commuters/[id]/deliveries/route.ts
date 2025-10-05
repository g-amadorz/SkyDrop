import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // TODO: Implement DeliveryService.getCommuterActiveDeliveries()
        // const deliveryService = new DeliveryService();
        // const deliveries = await deliveryService.getCommuterActiveDeliveries(id);

        return NextResponse.json(
            {
                success: true,
                data: {
                    commuterId: id,
                    activeDeliveries: [],
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get commuter deliveries error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
