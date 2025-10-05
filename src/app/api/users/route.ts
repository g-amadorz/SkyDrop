import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/userService';
import { createAccountSchema } from '@/lib/schemas/accountSchema';

const userService = new UserService();

export async function GET() {
    try {
        const users = await userService.getAllUsers();
        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createAccountSchema.parse(body);
        
        const user = await userService.createUser(validatedData);
        return NextResponse.json({ success: true, data: user }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
