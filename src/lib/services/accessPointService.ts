import { AccessPointRepository } from "@/lib/database/repository/accessPointRepository";
import { createAccessPointInput, updateAccessPointInput } from "@/lib/schemas/accessPointSchema";
import { AccessPointNotFoundError } from "@/lib/errors/accessPointErrors";

export class AccessPointService {
    private repository: AccessPointRepository;

    constructor() {
        this.repository = new AccessPointRepository();
    }

    async createAccessPoint(accessPointData: createAccessPointInput) {
        return await this.repository.createAccessPoint(accessPointData);
    }

    async findAccessPointById(id: string) {
        const accessPoint = await this.repository.findAccessPointById(id);
        if (!accessPoint) {
            throw new AccessPointNotFoundError(id);
        }
        return accessPoint;
    }

    async findAccessPointByName(name: string) {
        return await this.repository.findAccessPointByName(name);
    }

    async findAccessPointsByStation(stationName: string) {
        return await this.repository.findAccessPointsByStation(stationName);
    }

    async findAccessPointsByAccount(accountId: string) {
        return await this.repository.findAccessPointsByAccount(accountId);
    }

    async findNearbyAccessPoints(lat: number, lng: number, maxDistance?: number) {
        return await this.repository.findNearbyAccessPoints(lat, lng, maxDistance);
    }

    async updateAccessPoint(id: string, accessPointData: updateAccessPointInput) {
        const accessPoint = await this.repository.updateAccessPoint(id, accessPointData);
        if (!accessPoint) {
            throw new AccessPointNotFoundError(id);
        }
        return accessPoint;
    }

    async deleteAccessPoint(id: string) {
        const accessPoint = await this.repository.deleteAccessPoint(id);
        if (!accessPoint) {
            throw new AccessPointNotFoundError(id);
        }
        return accessPoint;
    }

    async getAllAccessPoints() {
        return await this.repository.getAllAccessPoints();
    }
}
