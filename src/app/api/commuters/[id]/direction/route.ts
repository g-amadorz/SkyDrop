import { NextRequest, NextResponse } from 'next/server';
import { CommuterService } from '@/lib/services/commuterService';
import { z } from 'zod';

const directionSchema = z.object({
    direction: z.enum(['VCC-CLARK', 'LAFARGE']),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const validatedData = directionSchema.parse(body);

        const commuterService = new CommuterService();
        const commuter = await commuterService.assignDirection(id, validatedData.direction);

        if (!commuter) {
            return NextResponse.json(
                { success: false, error: 'Commuter not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Direction assigned successfully',
                data: commuter,
            },
            { status: 200 }
        );
    } catch (error) {
        if ((error as any).name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid direction', details: (error as any).errors },
                { status: 400 }
            );
        }

        console.error('Assign direction error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
