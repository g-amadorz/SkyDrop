import { NextResponse, NextRequest } from 'next/server';
import { UserService } from '@/lib/services/userService';

export default async function shipperBalance(request: NextRequest) {
    
    const shipperId = request.nextUrl.searchParams.get('shipperId');
    
    if (!shipperId) {
        return NextResponse.json({ error: 'Shipper ID is required' }, { status: 400 });
    }
    
    const userService = new UserService();
    const user = await userService.findUserById(shipperId);
    
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user has the shipper role (sender)
    if (user.role !== 'sender') {
        return NextResponse.json({ error: 'User is not a shipper' }, { status: 403 });
    }
    
    // Check if shipper has sufficient balance (points)
    if (user.points <= 0) {
        return NextResponse.json({ error: 'Insufficient balance to register product' }, { status: 403 });
    }
    
    // Middleware passed - return success
    return NextResponse.json({ success: true, user }, { status: 200 });
}


