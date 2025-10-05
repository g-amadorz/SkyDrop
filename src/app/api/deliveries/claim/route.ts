import { NextRequest, NextResponse } from 'next/server';
import { claimPackageSchema } from '@/lib/schemas/deliverySchema';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = claimPackageSchema.parse(body);

        // TODO: Implement DeliveryService.claimPackage()
        // const deliveryService = new DeliveryService();
        // const result = await deliveryService.claimPackage(validatedData);

        return NextResponse.json(
            {
                success: true,
                message: 'Package(s) claimed successfully',
                data: validatedData,
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

        console.error('Claim package error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
