import { createProductInput, updateProductInput } from "@/lib/schemas/productSchema";
import Product from "@/lib/database/models/product";
import { IProduct } from "@/lib/database/models/product";

export class ProductRepository {
    constructor() {}

    async createProduct(productData: createProductInput): Promise<IProduct> {
        const product = await Product.create(productData);
        return product;
    }

    async findProductById(id: string): Promise<IProduct | null> {
        return await Product.findById(id);
    }

    async findProductByName(name: string): Promise<IProduct | null> {
        return await Product.findOne({ name: name.toLowerCase() });
    }

    async updateProduct(id: string, productData: updateProductInput): Promise<IProduct | null> {
        return await Product.findByIdAndUpdate(id, productData, {
            new: true,
            runValidators: true,
        });
    }

    async deleteProduct(id: string): Promise<IProduct | null> {
        return await Product.findByIdAndDelete(id);
    }

    async findProductsByStatus(status: 'pending' | 'in-transit' | 'delivered' | 'cancelled'): Promise<IProduct[]> {
        return await Product.find({ status }).select('-password');
    }

    async getAllProducts(): Promise<IProduct[]> {
        return await Product.find({}).select('-password');
    }
}