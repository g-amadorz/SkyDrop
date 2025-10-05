import { CommuterRepository } from "@/lib/database/repository/commuterRepository";
import { createCommuterInput, updateCommuterInput } from "@/lib/schemas/commuterSchema";

export class CommuterService {
    private repository: CommuterRepository;

    constructor() {
        this.repository = new CommuterRepository();
    }

    async createCommuter(commuterData: createCommuterInput) {
        return await this.repository.createCommuter(commuterData);
    }

    async findCommuterById(id: string) {
        return await this.repository.findCommuterById(id);
    }

    async findCommuterByAccount(accountId: string) {
        return await this.repository.findCommuterByAccount(accountId);
    }

    async updateCommuter(id: string, commuterData: updateCommuterInput) {
        return await this.repository.updateCommuter(id, commuterData);
    }

    async deleteCommuter(id: string) {
        return await this.repository.deleteCommuter(id);
    }

    async assignDirection(commuterId: string, direction: string) {
        return await this.repository.assignDirection(commuterId, direction);
    }

    async findCommutersByActiveProducts() {
        return await this.repository.findCommutersByActiveProducts();
    }

    async getAllCommuters() {
        return await this.repository.getAllCommuters();
    }

    async addProductToCommuter(commuterId: string, productId: string) {
        return await this.repository.addProductToCommuter(commuterId, productId);
    }

    async removeProductFromCommuter(commuterId: string, productId: string) {
        return await this.repository.removeProductFromCommuter(commuterId, productId);
    }
}
