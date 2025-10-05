import { NextRequest, NextResponse } from 'next/server';
import { CommuterService } from '@/lib/services/commuterService';
import { updateCommuterSchema } from '@/lib/schemas/commuterSchema';

const commuterService = new CommuterService();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const commuter = await commuterService.findCommuterById(params.id);
        if (!commuter) {
            return NextResponse.json(
                { success: false, error: 'Commuter not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: commuter });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch commuter' },
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
        const validatedData = updateCommuterSchema.parse(body);
        
        const commuter = await commuterService.updateCommuter(params.id, validatedData);
        if (!commuter) {
            return NextResponse.json(
                { success: false, error: 'Commuter not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: commuter });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to update commuter' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const commuter = await commuterService.deleteCommuter(params.id);
        if (!commuter) {
            return NextResponse.json(
                { success: false, error: 'Commuter not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, message: 'Commuter deleted successfully' });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to delete commuter' },
            { status: 500 }
        );
    }
}
