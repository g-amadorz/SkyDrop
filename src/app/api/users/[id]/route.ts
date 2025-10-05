import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/userService';
import { updateAccountSchema } from '@/lib/schemas/accountSchema';

const userService = new UserService();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await userService.findUserById(params.id);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user' },
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
        const validatedData = updateAccountSchema.parse(body);
        
        const user = await userService.updateUser(params.id, validatedData);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: user });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await userService.deleteUser(params.id);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
