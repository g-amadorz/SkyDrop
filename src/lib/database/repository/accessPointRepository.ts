import AccessPoint from "@/lib/database/models/AccessPointSchema";
import { createAccessPointInput, updateAccessPointInput } from "@/lib/schemas/accessPointSchema";
import { IAccessPoint } from "@/lib/database/models/AccessPointSchema";


export class AccessPointRepository {
    constructor() {}

    async createAccessPoint(accessPointData: createAccessPointInput): Promise<IAccessPoint> {
        const accessPoint = await AccessPoint.create(accessPointData);
        return accessPoint;
    }

    async findAccessPointById(id: string): Promise<IAccessPoint | null> {
        return await AccessPoint.findById(id);
    }

    async findAccessPointByName(name: string): Promise<IAccessPoint | null> {
        return await AccessPoint.findOne({ name: name.toLowerCase() });
    }

    async updateAccessPoint(id: string, accessPointData: updateAccessPointInput): Promise<IAccessPoint | null> {
        return await AccessPoint.findByIdAndUpdate(id, accessPointData, {
            new: true,
            runValidators: true,
        });
    }

    async deleteAccessPoint(id: string): Promise<IAccessPoint | null> {
        return await AccessPoint.findByIdAndDelete(id);
    }

    async findAccessPointsByStatus(status: 'pending' | 'in-transit' | 'delivered' | 'cancelled'): Promise<IAccessPoint[]> {
        return await AccessPoint.find({ status }).select('-password');
    }

    async getAllAccessPoints(): Promise<IAccessPoint[]> {
        return await AccessPoint.find({}).select('-password');
    }
}

