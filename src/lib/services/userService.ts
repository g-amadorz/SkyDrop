import { createAccountInput, updateAccountInput } from '@/lib/schemas/accountSchema';
import { IUser } from '@/lib/database/models/User';
import { UserRepository } from '@/lib/database/repository/userRepository';
import bcrypt from 'bcrypt';
import {
    UserNotFoundError,
    UserAlreadyExistsError,
    InvalidCredentialsError,
    InsufficientPointsError,
    AdminRoleToggleError,
    RoleAlreadySetError,
    InvalidRoleError,
    UserUpdateFailedError,
} from '@/lib/errors';

export class UserService {
    private repository: UserRepository;

    constructor() {
        this.repository = new UserRepository();
    }

    async createUser(userData: createAccountInput): Promise<IUser> {
        const existingUser = await this.repository.findUserByEmail(userData.email);
        if (existingUser) {
            throw new UserAlreadyExistsError(userData.email);
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
            throw new InvalidCredentialsError();
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new InvalidCredentialsError();
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
            throw new UserNotFoundError(id);
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
            throw new UserNotFoundError(userId);
        }
        const newPoints = user.points + points;

        if (newPoints < 0) {
            throw new InsufficientPointsError(Math.abs(points), user.points);
        }

        const updatedUser = await this.repository.updateUser(userId, {
            points: newPoints,
        });

        if (!updatedUser) {
            throw new UserUpdateFailedError('points update');
        }

        return updatedUser;
    }

    async toggleUserRole(userId: string, newRole: 'rider' | 'sender'): Promise<IUser> {
        const user = await this.findUserById(userId);
        if (!user) {
            throw new UserNotFoundError(userId);
        }

        // Prevent toggling if user is an admin
        if (user.role === 'admin') {
            throw new AdminRoleToggleError();
        }

        // Validate that the new role is different from current role
        if (user.role === newRole) {
            throw new RoleAlreadySetError(newRole);
        }

        // Only allow toggling between 'rider' and 'sender'
        if (newRole !== 'rider' && newRole !== 'sender') {
            throw new InvalidRoleError();
        }

        const updatedUser = await this.repository.updateUser(userId, {
            role: newRole,
        });

        if (!updatedUser) {
            throw new UserUpdateFailedError('role update');
        }

        return updatedUser;
    }
}