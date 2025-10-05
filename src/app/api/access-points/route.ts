import { NextRequest, NextResponse } from 'next/server';
import { AccessPointService } from '@/lib/services/accessPointService';
import { createAccessPointSchema } from '@/lib/schemas/accessPointSchema';
import { connectMongo } from '@/lib/database/mongoose';

const accessPointService = new AccessPointService();

export async function GET() {
    try {
        await connectMongo();
        const accessPoints = await accessPointService.getAllAccessPoints();
        return NextResponse.json({ success: true, data: accessPoints });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch access points' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectMongo();
        const body = await request.json();
        const validatedData = createAccessPointSchema.parse(body);
        
        const accessPoint = await accessPointService.createAccessPoint(validatedData);
        return NextResponse.json({ success: true, data: accessPoint }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to create access point' },
            { status: 500 }
        );
    }
}
