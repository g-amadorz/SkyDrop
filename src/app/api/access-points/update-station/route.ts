import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/database/mongoose';
import AccessPoint from '@/lib/database/models/AccessPointSchema';

export async function POST(request: NextRequest) {
    try {
        await connectMongo();
        
        const body = await request.json();
        const { accessPointId, stationId } = body;

        if (!accessPointId || !stationId) {
            return NextResponse.json(
                { success: false, error: 'Missing accessPointId or stationId' },
                { status: 400 }
            );
        }

        // Update the access point with the stationId
        const updatedAP = await AccessPoint.findByIdAndUpdate(
            accessPointId,
            { stationId },
            { new: true, runValidators: true }
        );

        if (!updatedAP) {
            return NextResponse.json(
                { success: false, error: 'Access point not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { 
                success: true, 
                message: 'Access point updated', 
                data: updatedAP 
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update access point error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
