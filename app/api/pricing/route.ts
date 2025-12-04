import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pricing } from "@/lib/schema";
import { asc } from "drizzle-orm";

// GET - Public route to get pricing for display
export async function GET() {
  try {
    const prices = await db
      .select({
        vehicleType: pricing.vehicleType,
        interiorPrice: pricing.interiorPrice,
        exteriorPrice: pricing.exteriorPrice,
        bothPrice: pricing.bothPrice,
      })
      .from(pricing)
      .orderBy(asc(pricing.sortOrder));

    return NextResponse.json({ pricing: prices });
  } catch (error) {
    console.error("Failed to fetch pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}
