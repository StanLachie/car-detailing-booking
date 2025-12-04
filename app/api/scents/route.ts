import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scent } from "@/lib/schema";
import { eq } from "drizzle-orm";

// GET - Public route to get enabled scents for booking form
export async function GET() {
  try {
    const scents = await db
      .select({ id: scent.id, name: scent.name })
      .from(scent)
      .where(eq(scent.enabled, true))
      .orderBy(scent.name);

    return NextResponse.json({ scents });
  } catch (error) {
    console.error("Failed to fetch scents:", error);
    return NextResponse.json(
      { error: "Failed to fetch scents" },
      { status: 500 }
    );
  }
}
