import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/database/mongoose';
import User from '@/lib/database/models/User';
import AccessPoint from '@/lib/database/models/AccessPointSchema';
import Product from '@/lib/database/models/product';
import Delivery from '@/lib/database/models/Delivery';
import Commuter from '@/lib/database/models/Commuter';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
    try {
        await connectMongo();

        // Clear existing data
        await User.deleteMany({});
        await AccessPoint.deleteMany({});
        await Product.deleteMany({});
        await Delivery.deleteMany({});
        await Commuter.deleteMany({});

        // CREATE USERS
        const hashedPassword = await bcrypt.hash('password123', 10);

        const admin = await User.create({
            email: 'admin@skydrop.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'admin',
            points: 10000,
        });

        const shipper1 = await User.create({
            email: 'shipper1@example.com',
            password: hashedPassword,
            name: 'Alice Shipper',
            role: 'sender',
            points: 500,
        });

        const shipper2 = await User.create({
            email: 'shipper2@example.com',
            password: hashedPassword,
            name: 'Bob Shipper',
            role: 'sender',
            points: 300,
        });

        const commuter1 = await User.create({
            email: 'commuter1@example.com',
            password: hashedPassword,
            name: 'Charlie Commuter',
            role: 'rider',
            points: 50,
        });

        const commuter2 = await User.create({
            email: 'commuter2@example.com',
            password: hashedPassword,
            name: 'Diana Commuter',
            role: 'rider',
            points: 75,
        });

        // CREATE COMMUTER PROFILES
        const commuterProfile1 = await Commuter.create({
            account: commuter1._id,
            activeProductIds: [],
        });

        const commuterProfile2 = await Commuter.create({
            account: commuter2._id,
            activeProductIds: [],
        });

        // CREATE ACCESS POINTS
        const vccClark = await AccessPoint.create({
            name: 'VCC-Clark Hub',
            nearestStation: 'VCC-Clark',
            stationId: 'vcc-clark',
            account: admin._id,
            lat: 49.2659,
            lng: -123.0789,
        });

        const commercialBroadway = await AccessPoint.create({
            name: 'Commercial-Broadway Station',
            nearestStation: 'Commercial-Broadway',
            stationId: 'commercial-broadway',
            account: admin._id,
            lat: 49.2625,
            lng: -123.0693,
        });

        const renfrew = await AccessPoint.create({
            name: 'Renfrew Station Hub',
            nearestStation: 'Renfrew',
            stationId: 'renfrew',
            account: admin._id,
            lat: 49.2589,
            lng: -123.0452,
        });

        const lougheed = await AccessPoint.create({
            name: 'Lougheed Town Centre',
            nearestStation: 'Lougheed Town Centre',
            stationId: 'lougheed',
            account: admin._id,
            lat: 49.2486,
            lng: -122.8970,
        });

        const burquitlam = await AccessPoint.create({
            name: 'Burquitlam Station',
            nearestStation: 'Burquitlam',
            stationId: 'burquitlam',
            account: admin._id,
            lat: 49.2614,
            lng: -122.8899,
        });

        const lafarge = await AccessPoint.create({
            name: 'Lafarge Lake-Douglas Terminal',
            nearestStation: 'Lafarge Lake-Douglas',
            stationId: 'lafarge',
            account: admin._id,
            lat: 49.2786,
            lng: -122.7919,
        });

        // CREATE PRODUCTS
        const product1 = await Product.create({
            name: 'Electronics Package',
            description: 'Laptop and accessories',
            sender: shipper1._id,
            destinationAccessPoint: lafarge._id,
            currentLocation: vccClark._id,
            status: 'pending',
            recipient: {
                name: 'John Recipient',
                email: 'john@example.com',
                phone: '604-555-0001',
            },
        });

        const product2 = await Product.create({
            name: 'Books Bundle',
            description: 'Textbooks for university',
            sender: shipper1._id,
            destinationAccessPoint: lougheed._id,
            currentLocation: commercialBroadway._id,
            status: 'pending',
            recipient: {
                name: 'Sarah Student',
                email: 'sarah@example.com',
                phone: '604-555-0002',
            },
        });

        const product3 = await Product.create({
            name: 'Clothing Box',
            description: 'Winter clothes',
            sender: shipper2._id,
            destinationAccessPoint: burquitlam._id,
            currentLocation: renfrew._id,
            status: 'pending',
            recipient: {
                name: 'Mike Recipient',
                email: 'mike@example.com',
                phone: '604-555-0003',
            },
        });

        // CREATE DELIVERIES
        const delivery1 = await Delivery.create({
            productId: product1._id,
            shipperId: shipper1._id,
            originAccessPoint: vccClark._id,
            destinationAccessPoint: lafarge._id,
            currentAccessPoint: vccClark._id,
            status: 'awaiting-pickup',
            legs: [],
            totalCost: 26.40,
            paidAmount: 0,
            reservedAmount: 26.40,
            estimatedDistance: 16,
            actualDistance: 0,
            recipientVerificationCode: '123456',
        });

        const delivery2 = await Delivery.create({
            productId: product2._id,
            shipperId: shipper1._id,
            originAccessPoint: commercialBroadway._id,
            destinationAccessPoint: lougheed._id,
            currentAccessPoint: commercialBroadway._id,
            status: 'awaiting-pickup',
            legs: [],
            totalCost: 14.85,
            paidAmount: 0,
            reservedAmount: 14.85,
            estimatedDistance: 9,
            actualDistance: 0,
            recipientVerificationCode: '789012',
        });

        const delivery3 = await Delivery.create({
            productId: product3._id,
            shipperId: shipper2._id,
            originAccessPoint: renfrew._id,
            destinationAccessPoint: burquitlam._id,
            currentAccessPoint: renfrew._id,
            status: 'awaiting-pickup',
            legs: [],
            totalCost: 13.20,
            paidAmount: 0,
            reservedAmount: 13.20,
            estimatedDistance: 8,
            actualDistance: 0,
            recipientVerificationCode: '345678',
        });

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully',
            data: {
                users: {
                    admin: { email: admin.email, id: admin._id },
                    shippers: [
                        { email: shipper1.email, id: shipper1._id, points: shipper1.points },
                        { email: shipper2.email, id: shipper2._id, points: shipper2.points },
                    ],
                    commuters: [
                        { email: commuter1.email, id: commuter1._id, points: commuter1.points },
                        { email: commuter2.email, id: commuter2._id, points: commuter2.points },
                    ],
                },
                accessPoints: [
                    { name: vccClark.name, id: vccClark._id, stationId: vccClark.stationId },
                    { name: commercialBroadway.name, id: commercialBroadway._id, stationId: commercialBroadway.stationId },
                    { name: renfrew.name, id: renfrew._id, stationId: renfrew.stationId },
                    { name: lougheed.name, id: lougheed._id, stationId: lougheed.stationId },
                    { name: burquitlam.name, id: burquitlam._id, stationId: burquitlam.stationId },
                    { name: lafarge.name, id: lafarge._id, stationId: lafarge.stationId },
                ],
                products: [
                    { name: product1.name, id: product1._id },
                    { name: product2.name, id: product2._id },
                    { name: product3.name, id: product3._id },
                ],
                deliveries: [
                    { id: delivery1._id, cost: delivery1.totalCost, status: delivery1.status },
                    { id: delivery2._id, cost: delivery2.totalCost, status: delivery2.status },
                    { id: delivery3._id, cost: delivery3.totalCost, status: delivery3.status },
                ],
                credentials: {
                    password: 'password123',
                    note: 'Use this password for all demo accounts',
                },
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to seed database' },
            { status: 500 }
        );
    }
}
