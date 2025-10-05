import { NextRequest, NextResponse } from 'next/server';
import { updateDeliveryStatusSchema } from '@/lib/schemas/deliverySchema';
import DeliveryService from '@/lib/services/deliveryService';
import { connectMongo } from '@/lib/database/mongoose';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectMongo();
        const { id } = params;

        const deliveryService = new DeliveryService();
        const delivery = await deliveryService.getDeliveryById(id);

        return NextResponse.json(
            {
                success: true,
                data: delivery,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get delivery error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const validatedData = updateDeliveryStatusSchema.parse(body);

        // TODO: Implement DeliveryService.updateDeliveryStatus()
        // const deliveryService = new DeliveryService();
        // const delivery = await deliveryService.updateDeliveryStatus(id, validatedData);

        return NextResponse.json(
            {
                success: true,
                message: 'Delivery updated successfully',
                data: { id, ...validatedData },
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

        console.error('Update delivery error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // TODO: Implement DeliveryService.cancelDelivery()
        // const deliveryService = new DeliveryService();
        // await deliveryService.cancelDelivery(id);

        return NextResponse.json(
            {
                success: true,
                message: 'Delivery cancelled successfully',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Cancel delivery error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
