import { NextRequest, NextResponse } from 'next/server';
import { ShipperService } from '@/lib/services/shipperService';
import { createShipperSchema } from '@/lib/schemas/shipperSchema';

const shipperService = new ShipperService();

export async function GET() {
    try {
        const shippers = await shipperService.getAllShippers();
        return NextResponse.json({ success: true, data: shippers });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch shippers' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createShipperSchema.parse(body);
        
        const shipper = await shipperService.createShipper(validatedData);
        return NextResponse.json({ success: true, data: shipper }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to create shipper' },
            { status: 500 }
        );
    }
}
