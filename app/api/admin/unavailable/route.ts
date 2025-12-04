import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { unavailableSlot } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

function generateId() {
  return crypto.randomUUID();
}

// Get all unavailable slots
export async function GET() {
  try {
    const slots = await db.select().from(unavailableSlot);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Fetch unavailable slots error:", error);
    return NextResponse.json(
      { error: "Failed to fetch unavailable slots" },
      { status: 500 }
    );
  }
}

// Add unavailable slots (supports batch)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slots } = await request.json();

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid slots array" },
        { status: 400 }
      );
    }

    const newSlots = slots.map((slot: { date: string; timeOfDay: string }) => ({
      id: generateId(),
      date: slot.date,
      timeOfDay: slot.timeOfDay,
    }));

    await db.insert(unavailableSlot).values(newSlots);

    return NextResponse.json({ success: true, count: newSlots.length });
  } catch (error) {
    console.error("Create unavailable slots error:", error);
    return NextResponse.json(
      { error: "Failed to create unavailable slots" },
      { status: 500 }
    );
  }
}

// Remove unavailable slots
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slots } = await request.json();

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid slots array" },
        { status: 400 }
      );
    }

    // Delete each slot by date + timeOfDay combination
    for (const slot of slots) {
      await db
        .delete(unavailableSlot)
        .where(
          and(
            eq(unavailableSlot.date, slot.date),
            eq(unavailableSlot.timeOfDay, slot.timeOfDay)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete unavailable slots error:", error);
    return NextResponse.json(
      { error: "Failed to delete unavailable slots" },
      { status: 500 }
    );
  }
}
