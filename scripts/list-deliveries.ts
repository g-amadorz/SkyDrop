/**
 * List all deliveries in the database
 * Run with: MONGODB_URI="your-uri" npx tsx scripts/list-deliveries.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined');
    process.exit(1);
}

const deliverySchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    shipperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currentCommuterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    originAccessPoint: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessPoint', required: true },
    destinationAccessPoint: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessPoint', required: true },
    currentAccessPoint: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessPoint', required: true },
    status: { type: String, enum: ['awaiting-pickup', 'in-transit', 'ready-for-recipient', 'completed'], default: 'awaiting-pickup' },
    legs: [{ type: Object }],
    totalCost: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    reservedAmount: { type: Number, required: true },
    estimatedDistance: { type: Number, required: true },
    actualDistance: { type: Number, default: 0 },
    recipientVerificationCode: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
}, { timestamps: true });

const Delivery = mongoose.models.Delivery || mongoose.model('Delivery', deliverySchema);

async function listDeliveries() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const deliveries = await Delivery.find({}).sort({ createdAt: -1 });
        
        console.log(`Found ${deliveries.length} delivery/deliveries:\n`);
        
        if (deliveries.length === 0) {
            console.log('No deliveries found in the database.');
        } else {
            deliveries.forEach((delivery, index) => {
                console.log(`[${index + 1}] Delivery ID: ${delivery._id}`);
                console.log(`    Product ID: ${delivery.productId}`);
                console.log(`    Shipper ID: ${delivery.shipperId}`);
                console.log(`    Origin Access Point ID: ${delivery.originAccessPoint}`);
                console.log(`    Destination Access Point ID: ${delivery.destinationAccessPoint}`);
                console.log(`    Status: ${delivery.status}`);
                console.log(`    Total Cost: ${delivery.totalCost} points`);
                console.log(`    Estimated Distance: ${delivery.estimatedDistance} stations`);
                console.log(`    Verification Code: ${delivery.recipientVerificationCode}`);
                console.log(`    Created At: ${delivery.createdAt}`);
                console.log('');
            });
        }

        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

listDeliveries();
