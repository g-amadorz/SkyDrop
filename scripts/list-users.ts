/**
 * List all users in the database
 * Run with: MONGODB_URI="your-uri" npx tsx scripts/list-users.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined');
    process.exit(1);
}

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String },
    role: { type: String, enum: ['sender', 'rider', 'admin'], default: 'sender' },
    points: { type: Number, default: 0 },
    clerkId: { type: String, unique: true, sparse: true },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function listUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const users = await User.find({});
        
        console.log(`Found ${users.length} user(s):\n`);
        
        users.forEach((user, index) => {
            console.log(`[${index + 1}] ${user.name || 'No name'}`);
            console.log(`    Email: ${user.email}`);
            console.log(`    Role: ${user.role}`);
            console.log(`    Points: ${user.points}`);
            console.log(`    Clerk ID: ${user.clerkId || 'Not set'}`);
            console.log(`    MongoDB ID: ${user._id}`);
            console.log('');
        });

        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

listUsers();
