import { ProductRepository } from "@/lib/database/repository/productRepository";
import { createProductInput, updateProductInput } from "@/lib/schemas/productSchema";



export class ProductService {
    private repository: ProductRepository;

    constructor() {
        this.repository = new ProductRepository();
    }

    async createProduct(productData: createProductInput) {
        return await this.repository.createProduct(productData);
    }

    async findProductById(id: string) {
        return await this.repository.findProductById(id);
    }

    async findProductByName(name: string) {
        return await this.repository.findProductByName(name);
    }

    async updateProduct(id: string, productData: updateProductInput) {
        return await this.repository.updateProduct(id, productData);
    }

    async deleteProduct(id: string) {
        return await this.repository.deleteProduct(id);
    }

    async findProductsByStatus(status: 'pending' | 'in-transit' | 'delivered' | 'cancelled') {
        return await this.repository.findProductsByStatus(status);
    }

    async getAllProducts() {
        return await this.repository.getAllProducts();
    }
}




