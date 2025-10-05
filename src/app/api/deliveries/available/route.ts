import { NextRequest, NextResponse } from 'next/server';
import { getAvailablePackagesSchema } from '@/lib/schemas/deliverySchema';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const queryData = {
            accessPointId: searchParams.get('accessPointId') || undefined,
            maxDistance: searchParams.get('maxDistance') ? Number(searchParams.get('maxDistance')) : undefined,
            minEarnings: searchParams.get('minEarnings') ? Number(searchParams.get('minEarnings')) : undefined,
            destinationDirection: searchParams.get('destinationDirection') as 'VCC-CLARK' | 'LAFARGE' | undefined,
        };

        const validatedData = getAvailablePackagesSchema.parse(queryData);

        // TODO: Implement DeliveryService.getAvailablePackages()
        // const deliveryService = new DeliveryService();
        // const packages = await deliveryService.getAvailablePackages(validatedData);

        return NextResponse.json(
            {
                success: true,
                data: {
                    packages: [],
                    filters: validatedData,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        if ((error as any).name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid query parameters', details: (error as any).errors },
                { status: 400 }
            );
        }

        console.error('Get available packages error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
