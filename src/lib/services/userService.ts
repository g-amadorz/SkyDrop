import { createAccountInput, updateAccountInput } from '@/lib/schemas/accountSchema';
import { IUser } from '@/lib/database/models/User';
import { UserRepository } from '@/lib/database/repository/userRepository';
import bcrypt from 'bcrypt';

export class UserService {
    private repository: UserRepository;

    constructor() {
        this.repository = new UserRepository();
    }

    async createUser(userData: createAccountInput): Promise<IUser> {
        const existingUser = await this.repository.findUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const newUser = await this.repository.createUser({
            ...userData,
            role: 'sender',
        });

        return newUser;
    }

    async loginUser(email: string, password: string): Promise<IUser> {
        const user = await this.repository.findUserByEmail(email);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        return user;
    }

    async findUserById(id: string): Promise<IUser | null> {
        return await this.repository.findUserById(id);
    }

    async updateUser(id: string, userData: updateAccountInput): Promise<IUser> {
        // If password is being updated, hash it
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        const updatedUser = await this.repository.updateUser(id, userData);
        
        if (!updatedUser) {
            throw new Error('User not found');
        }

        return updatedUser;
    }

    async deleteUser(id: string): Promise<IUser | null> {
        return await this.repository.deleteUser(id);
    }

    async getUsersByRole(role: 'rider' | 'sender' | 'admin'): Promise<IUser[]> {
        return await this.repository.findUsersByRole(role);
    }

    async getAllUsers(): Promise<IUser[]> {
        return await this.repository.getAllUsers();
    }

    async addPointsToUser(userId: string, points: number): Promise<IUser> {
        const user = await this.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const newPoints = user.points + points;

        if (newPoints < 0) {
            throw new Error('Insufficient points');
        }

        const updatedUser = await this.repository.updateUser(userId, {
            points: newPoints,
        });

        if (!updatedUser) {
            throw new Error('Failed to update user points');
        }

        return updatedUser;
    }

    async toggleUserRole(userId: string, newRole: 'rider' | 'sender'): Promise<IUser> {
        const user = await this.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Prevent toggling if user is an admin
        if (user.role === 'admin') {
            throw new Error('Cannot toggle role for admin users');
        }

        // Validate that the new role is different from current role
        if (user.role === newRole) {
            throw new Error(`User is already a ${newRole}`);
        }

        // Only allow toggling between 'rider' and 'sender'
        if (newRole !== 'rider' && newRole !== 'sender') {
            throw new Error('Can only toggle between rider and sender roles');
        }

        const updatedUser = await this.repository.updateUser(userId, {
            role: newRole,
        });

        if (!updatedUser) {
            throw new Error('Failed to update user role');
        }

        return updatedUser;
    }
}