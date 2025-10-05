import { NextRequest, NextResponse } from 'next/server';
import { ShipperService } from '@/lib/services/shipperService';
import { updateShipperSchema } from '@/lib/schemas/shipperSchema';

const shipperService = new ShipperService();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shipper = await shipperService.findShipperById(params.id);
        if (!shipper) {
            return NextResponse.json(
                { success: false, error: 'Shipper not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: shipper });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch shipper' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const validatedData = updateShipperSchema.parse(body);
        
        const shipper = await shipperService.updateShipper(params.id, validatedData);
        if (!shipper) {
            return NextResponse.json(
                { success: false, error: 'Shipper not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: shipper });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to update shipper' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shipper = await shipperService.deleteShipper(params.id);
        if (!shipper) {
            return NextResponse.json(
                { success: false, error: 'Shipper not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, message: 'Shipper deleted successfully' });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to delete shipper' },
            { status: 500 }
        );
    }
}
