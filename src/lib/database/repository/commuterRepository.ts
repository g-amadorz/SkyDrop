import Commuter from "@/lib/database/models/Commuter";
import { ICommuter } from "@/lib/database/models/Commuter";
import { createCommuterInput, updateCommuterInput } from "@/lib/schemas/commuterSchema";

export class CommuterRepository {
    constructor() {}

    async createCommuter(commuterData: createCommuterInput): Promise<ICommuter> {
        const commuter = await Commuter.create(commuterData);
        return commuter;
    }

    async findCommuterById(id: string): Promise<ICommuter | null> {
        return await Commuter.findById(id).populate('account').populate('activeProductIds');
    }

    async findCommuterByAccount(accountId: string): Promise<ICommuter | null> {
        return await Commuter.findOne({ account: accountId }).populate('account').populate('activeProductIds');
    }

    async updateCommuter(id: string, commuterData: updateCommuterInput): Promise<ICommuter | null> {
        return await Commuter.findByIdAndUpdate(id, commuterData, {
            new: true,
            runValidators: true,
        }).populate('account').populate('activeProductIds');
    }

    async deleteCommuter(id: string): Promise<ICommuter | null> {
        return await Commuter.findByIdAndDelete(id);
    }

    async findCommutersByActiveProducts(): Promise<ICommuter[]> {
        return await Commuter.find({ activeProductIds: { $ne: [] } }).populate('account').populate('activeProductIds');
    }

    async getAllCommuters(): Promise<ICommuter[]> {
        return await Commuter.find({}).populate('account').populate('activeProductIds');
    }

    async addProductToCommuter(commuterId: string, productId: string): Promise<ICommuter | null> {
        return await Commuter.findByIdAndUpdate(
            commuterId,
            { $addToSet: { activeProductIds: productId } },
            { new: true, runValidators: true }
        ).populate('account').populate('activeProductIds');
    }

    async removeProductFromCommuter(commuterId: string, productId: string): Promise<ICommuter | null> {
        return await Commuter.findByIdAndUpdate(
            commuterId,
            { $pull: { activeProductIds: productId } },
            { new: true, runValidators: true }
        ).populate('account').populate('activeProductIds');
    }
}
