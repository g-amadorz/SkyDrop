import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
    try {
        await connectMongo();
        
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ clerkId: userId });
        if (existingUser) {
            return NextResponse.json(
                { success: true, message: 'User already exists', data: existingUser },
                { status: 200 }
            );
        }

        const body = await request.json();
        const { email, name, role = 'sender' } = body;

        // Create new user with Clerk ID
        const newUser = await User.create({
            clerkId: userId,
            email: email || `${userId}@clerk.temp`,
            name: name || 'Clerk User',
            role,
            password: 'clerk-managed', // Not used for Clerk users
            points: 0
        });

        return NextResponse.json(
            { success: true, message: 'User created successfully', data: newUser },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create user from Clerk error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
