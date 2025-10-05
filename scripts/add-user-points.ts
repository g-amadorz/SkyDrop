/**
 * Add points to a user account
 * Run with: MONGODB_URI="your-uri" USER_EMAIL="email" POINTS=100 npx tsx scripts/add-user-points.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const USER_EMAIL = process.env.USER_EMAIL;
const POINTS = parseInt(process.env.POINTS || '100');

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined');
    console.error('Usage: MONGODB_URI="..." USER_EMAIL="user@example.com" POINTS=100 npx tsx scripts/add-user-points.ts');
    process.exit(1);
}

if (!USER_EMAIL) {
    console.error('❌ USER_EMAIL is not defined');
    console.error('Usage: MONGODB_URI="..." USER_EMAIL="user@example.com" POINTS=100 npx tsx scripts/add-user-points.ts');
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

async function addPoints() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        console.log(`Looking for user: ${USER_EMAIL}`);
        const user = await User.findOne({ email: USER_EMAIL });

        if (!user) {
            console.error(`✗ User not found: ${USER_EMAIL}`);
            console.log('\nAvailable users:');
            const allUsers = await User.find({});
            allUsers.forEach(u => {
                console.log(`  - ${u.email} (${u.points} points, role: ${u.role})`);
            });
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log(`\nFound user: ${user.name || user.email}`);
        console.log(`Current points: ${user.points}`);
        console.log(`Adding: ${POINTS} points`);

        user.points += POINTS;
        await user.save();

        console.log(`New balance: ${user.points} points`);
        console.log('\n✓ Points added successfully!');

        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

addPoints();
