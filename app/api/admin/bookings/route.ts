import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { booking } from "@/lib/schema";
import { eq, gte, lt, and, or, inArray, notInArray } from "drizzle-orm";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Sort helper: morning before afternoon
    const timeOrder = { morning: 0, afternoon: 1 };
    const sortByDateTime = (a: { date: string; timeOfDay: string }, b: { date: string; timeOfDay: string }, descending = false) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return descending ? -dateCompare : dateCompare;
      const aTime = timeOrder[a.timeOfDay as keyof typeof timeOrder] ?? 0;
      const bTime = timeOrder[b.timeOfDay as keyof typeof timeOrder] ?? 0;
      return descending ? bTime - aTime : aTime - bTime;
    };

    // Parse attachments JSON helper
    const parseAttachments = (b: typeof booking.$inferSelect) => ({
      ...b,
      attachments: b.attachments ? JSON.parse(b.attachments) : null,
    });

    // Get upcoming bookings (today/future AND not completed/cancelled)
    const upcomingRaw = await db
      .select()
      .from(booking)
      .where(
        and(
          gte(booking.date, today),
          notInArray(booking.status, ["completed", "cancelled"])
        )
      );
    const upcoming = upcomingRaw
      .sort((a, b) => sortByDateTime(a, b))
      .map(parseAttachments);

    // Get past bookings (past date OR completed/cancelled)
    const pastRaw = await db
      .select()
      .from(booking)
      .where(
        or(
          lt(booking.date, today),
          inArray(booking.status, ["completed", "cancelled"])
        )
      );
    const past = pastRaw
      .sort((a, b) => sortByDateTime(a, b, true))
      .map(parseAttachments);

    return NextResponse.json({ upcoming, past });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status, date, timeOfDay } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing id or status" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Build update object
    const updateData: { status: string; date?: string; timeOfDay?: string } = { status };
    if (date) updateData.date = date;
    if (timeOfDay) updateData.timeOfDay = timeOfDay;

    const updated = await db
      .update(booking)
      .set(updateData)
      .where(eq(booking.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking: updated[0] });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
