import { NextRequest, NextResponse } from 'next/server';
import { AccessPointService } from '@/lib/services/accessPointService';
import { updateAccessPointSchema } from '@/lib/schemas/accessPointSchema';

const accessPointService = new AccessPointService();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const accessPoint = await accessPointService.findAccessPointById(params.id);
        if (!accessPoint) {
            return NextResponse.json(
                { success: false, error: 'Access point not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: accessPoint });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch access point' },
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
        const validatedData = updateAccessPointSchema.parse(body);
        
        const accessPoint = await accessPointService.updateAccessPoint(params.id, validatedData);
        if (!accessPoint) {
            return NextResponse.json(
                { success: false, error: 'Access point not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: accessPoint });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to update access point' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const accessPoint = await accessPointService.deleteAccessPoint(params.id);
        if (!accessPoint) {
            return NextResponse.json(
                { success: false, error: 'Access point not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, message: 'Access point deleted successfully' });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to delete access point' },
            { status: 500 }
        );
    }
}
