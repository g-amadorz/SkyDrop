import { ShipperRepository } from "@/lib/database/repository/shipperRepository";
import { createShipperInput, updateShipperInput } from "@/lib/schemas/shipperSchema";

export class ShipperService {
    private repository: ShipperRepository;

    constructor() {
        this.repository = new ShipperRepository();
    }

    async createShipper(shipperData: createShipperInput) {
        return await this.repository.createShipper(shipperData);
    }

    async findShipperById(id: string) {
        return await this.repository.findShipperById(id);
    }

    async findShipperByAccount(accountId: string) {
        return await this.repository.findShipperByAccount(accountId);
    }

    async updateShipper(id: string, shipperData: updateShipperInput) {
        return await this.repository.updateShipper(id, shipperData);
    }

    async deleteShipper(id: string) {
        return await this.repository.deleteShipper(id);
    }

    async findShippersByActiveProducts() {
        return await this.repository.findShippersByActiveProducts();
    }

    async getAllShippers() {
        return await this.repository.getAllShippers();
    }

    async addProductToShipper(shipperId: string, productId: string) {
        return await this.repository.addProductToShipper(shipperId, productId);
    }

    async removeProductFromShipper(shipperId: string, productId: string) {
        return await this.repository.removeProductFromShipper(shipperId, productId);
    }
}
