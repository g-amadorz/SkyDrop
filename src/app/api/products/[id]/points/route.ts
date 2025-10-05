import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/database/mongoose";
import User from "@/lib/database/models/User"; // ✅ make sure this points to src/lib/database/models/user.ts

// PATCH: update points (charge or deduct)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    const { amount } = await req.json(); // ex: +100 for charge, -50 for deduction

    const user = await User.findById(params.id);
    if (!user)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );

    const newPoints = user.points + amount;
    if (newPoints < 0) {
      return NextResponse.json(
        { success: false, error: "Insufficient points" },
        { status: 400 }
      );
    }

    user.points = newPoints;
    await user.save();

    return NextResponse.json({
      success: true,
      user,
      points: user.points,
    });
  } catch (err) {
    console.error("PATCH /users/[id]/points error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update points" },
      { status: 500 }
    );
  }
}
