import User from '@/lib/database/models/User';
import { createAccountInput, updateAccountInput } from '@/schemas/accountSchema';
import { IUser } from '@/lib/database/models/User';

export class UserRepository {
    async createUser(userData: createAccountInput): Promise<IUser> {
        const user = await User.create(userData);
        return user;
    }

    async findUserById(id: string): Promise<IUser | null> {
        return await User.findById(id).select('-password');
    }

    async findUserByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email: email.toLowerCase() });
    }

    async updateUser(id: string, userData: updateAccountInput): Promise<IUser | null> {
        return await User.findByIdAndUpdate(id, userData, {
            new: true,
            runValidators: true,
        }).select('-password');
    }

    async deleteUser(id: string): Promise<IUser | null> {
        return await User.findByIdAndDelete(id);
    }

    async findUsersByRole(role: 'rider' | 'sender' | 'admin'): Promise<IUser[]> {
        return await User.find({ role }).select('-password');
    }

    async getAllUsers(): Promise<IUser[]> {
        return await User.find({}).select('-password');
    }
}