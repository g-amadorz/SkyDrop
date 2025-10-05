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
        return await AccessPoint.findOne({ name });
    }

    async findAccessPointsByStation(stationId: string): Promise<IAccessPoint[]> {
        return await AccessPoint.find({ stationId });
    }

    async findAccessPointsByAccount(accountId: string): Promise<IAccessPoint[]> {
        return await AccessPoint.find({ account: accountId });
    }

    async findNearbyAccessPoints(lat: number, lng: number, maxDistance: number = 5000): Promise<IAccessPoint[]> {
        // Find access points within maxDistance meters (default 5km)
        return await AccessPoint.find({
            lat: { $gte: lat - (maxDistance / 111000), $lte: lat + (maxDistance / 111000) },
            lng: { $gte: lng - (maxDistance / 111000), $lte: lng + (maxDistance / 111000) }
        });
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

    async getAllAccessPoints(): Promise<IAccessPoint[]> {
        return await AccessPoint.find({});
    }
}

