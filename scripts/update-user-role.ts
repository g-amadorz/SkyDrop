// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now import other modules
import { connectMongo } from '../src/lib/database/mongoose';
import User from '../src/lib/database/models/user';

async function updateUserRole() {
    try {
        await connectMongo();
        console.log('Connected to MongoDB');

        // Find all users with sender or rider role and update to 'both'
        const result = await User.updateMany(
            { role: { $in: ['sender', 'rider'] } },
            { $set: { role: 'both' } }
        );

        console.log(`Updated ${result.modifiedCount} user(s) to 'both' role`);

        // List all users
        const users = await User.find({}, 'email name role points');
        console.log('\nAll users:');
        users.forEach(user => {
            console.log(`- ${user.email}: ${user.name} (${user.role}) - ${user.points} points`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error updating user role:', error);
        process.exit(1);
    }
}

updateUserRole();
