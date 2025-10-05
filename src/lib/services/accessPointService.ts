import { AccessPointRepository } from "@/lib/database/repository/accessPointRepository";
import { createAccessPointInput, updateAccessPointInput } from "@/lib/schemas/accessPointSchema";

export class AccessPointService {
    private repository: AccessPointRepository;

    constructor() {
        this.repository = new AccessPointRepository();
    }

    async createAccessPoint(accessPointData: createAccessPointInput) {
        return await this.repository.createAccessPoint(accessPointData);
    }

    async findAccessPointById(id: string) {
        return await this.repository.findAccessPointById(id);
    }

    async updateAccessPoint(id: string, accessPointData: updateAccessPointInput) {
        return await this.repository.updateAccessPoint(id, accessPointData);
    }

    async deleteAccessPoint(id: string) {
        return await this.repository.deleteAccessPoint(id);
    }

    async findAccessPointsByStatus(status: 'pending' | 'in-transit' | 'delivered' | 'cancelled') {
        return await this.repository.findAccessPointsByStatus(status);
    }

    async getAllAccessPoints() {
        return await this.repository.getAllAccessPoints();
    }
}
