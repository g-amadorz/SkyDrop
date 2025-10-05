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

        const body = await request.json();
        const { points = 100 } = body;

        // Find user by Clerk ID
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found in database' },
                { status: 404 }
            );
        }

        // Add points
        user.points = (user.points || 0) + points;
        await user.save();

        return NextResponse.json(
            { 
                success: true, 
                message: `Added ${points} points`, 
                data: { 
                    totalPoints: user.points,
                    pointsAdded: points
                } 
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Add points error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
