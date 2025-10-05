// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ProductService } from "@/lib/services/productService";
import { createProductSchema } from "@/lib/schemas/productSchema";
import Shipper from "@/lib/database/models/Shipper";
import { connectMongo } from "@/lib/database/mongoose";

export const runtime = "nodejs"; // Clerk + Mongoose require Node runtime

const productService = new ProductService();

// --- GET: list products for the signed-in shipper ---
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();
    const shipper = await Shipper.findOne({ clerkUserId: userId }).select("_id");
    if (!shipper) return NextResponse.json({ success: true, data: [] });

    const products = await productService.getAllProducts();
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// --- POST: create a product (spend points + register shipment) ---
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createProductSchema.parse(body);

    const { originAccessPointId, destinationAccessPointId } = validated;
    if (weightLb > 5) {
      return NextResponse.json(
        { success: false, error: "Max weight is 5 lb" },
        { status: 400 }
      );
    }

    await connectMongo();

    // 1️⃣ find the shipper profile by Clerk userId
    const shipper = await Shipper.findOne({ clerkUserId: userId });
    if (!shipper) {
      return NextResponse.json(
        { success: false, error: "Shipper profile not found" },
        { status: 404 }
      );
    }

    // 2️⃣ compute quoted points (temporary simple rule)
    // Replace this later with your station-hop algorithm
    const baseCost = 10;
    const quotedPoints = baseCost + Math.floor(Math.random() * 10);

    // 3️⃣ check if user has enough points
    if ((shipper.pointsBalance ?? 0) < quotedPoints) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient points",
          currentBalance: shipper.pointsBalance ?? 0,
          required: quotedPoints,
        },
        { status: 402 } // 402 Payment Required
      );
    }

    // 4️⃣ deduct points atomically
    const idempotencyKey =
      request.headers.get("Idempotency-Key") || `ship-${uuidv4()}`;
    await applyPoints({
      shipperId: shipper._id.toString(),
      amount: -quotedPoints,
      reason: "ship_spend",
      idempotencyKey,
    });

    // 5️⃣ create the product (shipment record)
    const product = await productService.createProduct({
      ...validated,
      shipperId: shipper._id.toString(),
      status: "at_origin",
      currentAccessPointId: originAccessPointId,
      destinationAccessPointId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Shipment created successfully",
        deductedPoints: quotedPoints,
        data: product,
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
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
