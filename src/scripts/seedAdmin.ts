/**
 * Admin Seeding Script for Demo
 * Creates demo data: Users, AccessPoints, Products, and Deliveries
 */

import mongoose from 'mongoose';
import { connectMongo } from '@/lib/database/mongoose';
import User from '@/lib/database/models/User';
import AccessPoint from '@/lib/database/models/AccessPointSchema';
import Product from '@/lib/database/models/product';
import Delivery from '@/lib/database/models/Delivery';
import Commuter from '@/lib/database/models/Commuter';
import bcrypt from 'bcrypt';

async function seedDatabase() {
    try {
        await connectMongo();
        console.log('🔗 Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await AccessPoint.deleteMany({});
        await Product.deleteMany({});
        await Delivery.deleteMany({});
        await Commuter.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // 1. CREATE USERS
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

        console.log('✅ Created 5 users (1 admin, 2 shippers, 2 commuters)');

        // 2. CREATE COMMUTER PROFILES
        const commuterProfile1 = await Commuter.create({
            account: commuter1._id,
            activeProductIds: [],
        });

        const commuterProfile2 = await Commuter.create({
            account: commuter2._id,
            activeProductIds: [],
        });

        console.log('✅ Created 2 commuter profiles');

        // 3. CREATE ACCESS POINTS (Millennium Line stations)
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

        console.log('✅ Created 6 access points along Millennium Line');

        // 4. CREATE PRODUCTS
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

        console.log('✅ Created 3 products');

        // 5. CREATE DELIVERIES
        const delivery1 = await Delivery.create({
            productId: product1._id,
            shipperId: shipper1._id,
            originAccessPoint: vccClark._id,
            destinationAccessPoint: lafarge._id,
            currentAccessPoint: vccClark._id,
            status: 'awaiting-pickup',
            legs: [],
            totalCost: 26.40, // 16 hops * $1.50 * 1.10
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
            totalCost: 14.85, // 9 hops * $1.50 * 1.10
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
            totalCost: 13.20, // 8 hops * $1.50 * 1.10
            paidAmount: 0,
            reservedAmount: 13.20,
            estimatedDistance: 8,
            actualDistance: 0,
            recipientVerificationCode: '345678',
        });

        console.log('✅ Created 3 deliveries');

        // SUMMARY
        console.log('\n📊 DEMO DATA SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👥 USERS:');
        console.log(`   Admin: ${admin.email} (${admin.points} points)`);
        console.log(`   Shipper 1: ${shipper1.email} (${shipper1.points} points)`);
        console.log(`   Shipper 2: ${shipper2.email} (${shipper2.points} points)`);
        console.log(`   Commuter 1: ${commuter1.email} (${commuter1.points} points)`);
        console.log(`   Commuter 2: ${commuter2.email} (${commuter2.points} points)`);
        console.log(`   Password for all: password123`);
        console.log('\n📍 ACCESS POINTS:');
        console.log(`   ${vccClark.name} (${vccClark.stationId})`);
        console.log(`   ${commercialBroadway.name} (${commercialBroadway.stationId})`);
        console.log(`   ${renfrew.name} (${renfrew.stationId})`);
        console.log(`   ${lougheed.name} (${lougheed.stationId})`);
        console.log(`   ${burquitlam.name} (${burquitlam.stationId})`);
        console.log(`   ${lafarge.name} (${lafarge.stationId})`);
        console.log('\n📦 PRODUCTS & DELIVERIES:');
        console.log(`   1. ${product1.name} → ${lafarge.name} ($${delivery1.totalCost})`);
        console.log(`   2. ${product2.name} → ${lougheed.name} ($${delivery2.totalCost})`);
        console.log(`   3. ${product3.name} → ${burquitlam.name} ($${delivery3.totalCost})`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✨ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
