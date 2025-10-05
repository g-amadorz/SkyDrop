import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/lib/services/productService";
import { createProductSchema } from "@/lib/schemas/productSchema";
import DeliveryService from "@/lib/services/deliveryService";
import { connectMongo } from "@/lib/database/mongoose";

const productService = new ProductService();

export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    
    const searchParams = request.nextUrl.searchParams;
    const senderId = searchParams.get('senderId');
    const status = searchParams.get('status');

    let products;
    if (senderId) {
      products = await productService.getAllProducts();
      products = products.filter((p: any) => p.sender?.toString() === senderId);
    } else if (status) {
      products = await productService.findProductsByStatus(status as any);
    } else {
      products = await productService.getAllProducts();
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    
    const body = await request.json();
    const validated = createProductSchema.parse(body);

    // Create the product
    const product = await productService.createProduct(validated);

    // Create delivery for the product
    const deliveryService = new DeliveryService();
    const delivery = await deliveryService.initiateDelivery(validated.sender, {
      productId: (product as any)._id.toString(),
      shipperId: validated.sender,
      originAccessPoint: validated.currentLocation,
      destinationAccessPoint: validated.destinationAccessPoint,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product and delivery created successfully",
        data: {
          product,
          delivery,
          cost: delivery.totalCost,
          verificationCode: delivery.recipientVerificationCode,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
