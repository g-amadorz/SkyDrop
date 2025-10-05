import { NextRequest, NextResponse } from 'next/server';
import { CommuterService } from '@/lib/services/commuterService';
import { createCommuterSchema } from '@/lib/schemas/commuterSchema';

const commuterService = new CommuterService();

export async function GET() {
    try {
        const commuters = await commuterService.getAllCommuters();
        return NextResponse.json({ success: true, data: commuters });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch commuters' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createCommuterSchema.parse(body);
        
        const commuter = await commuterService.createCommuter(validatedData);
        return NextResponse.json({ success: true, data: commuter }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to create commuter' },
            { status: 500 }
        );
    }
}
