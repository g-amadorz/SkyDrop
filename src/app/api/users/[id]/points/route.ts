import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/database/mongoose";
import { UserService } from "@/lib/services/userService";
import User from "@/lib/database/models/User";
import { connectDB } from "@/lib/database/connect";
await connectDB();
const userService = new UserService();

/**
 * ✅ Create new user (Signup)
 */
export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    const body = await req.json();

    // Use your UserService logic (handles hashing + duplicate check)
    const newUser = await userService.createUser(body);

    return NextResponse.json(
      { success: true, user: newUser },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("❌ Signup error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

/**
 * ✅ Add points to user
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectMongo();
    const { amount } = await req.json();
    const { id } = params;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    user.points = (user.points || 0) + amount;
    await user.save();

    return NextResponse.json({ success: true, points: user.points });
  } catch (err: any) {
    console.error("🔥 Error charging points:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to charge points" },
      { status: 500 }
    );
  }
}
