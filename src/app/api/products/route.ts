import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';
import { createProductSchema } from '@/lib/schemas/productSchema';
import shipperBalance from '@/middlewares/shipperBalance';

const productService = new ProductService();

export async function GET() {
    try {
        const products = await productService.getAllProducts();
        return NextResponse.json({ success: true, data: products });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    // Run middleware to check shipper balance
    const middlewareResponse = await shipperBalance(request);
    if (middlewareResponse.status !== 200) {
        return middlewareResponse;
    }
    
    try {
        const body = await request.json();
        const validatedData = createProductSchema.parse(body);
        
        const product = await productService.createProduct(validatedData);
        return NextResponse.json({ success: true, data: product }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
