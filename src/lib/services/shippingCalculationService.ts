import { UserService } from './userService'
import { createProductInput } from '@/lib/schemas/productSchema'

export class ShippingCalculationService {
    private productService: ProductService
    private baseUrl: string

    constructor() {
        this.productService = new ProductService()
        this.baseUrl = "https://nominatim.openstreetmap.org"
    }

    async calculateShippingCost(): Promise<number> {
        const adress: string = productData.destination
    
    }


}
