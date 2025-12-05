import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { booking, unavailableSlot } from "@/lib/schema";
import { eq, and, or } from "drizzle-orm";
import { sendSMS } from "@/lib/sms";
import { generateBookingNotificationMessage, MAX_BOOKING_DAYS_AHEAD } from "@/lib/config";

const BRISBANE_TZ = "Australia/Brisbane";
const SLOT_START_HOURS = { morning: 9, afternoon: 13 };

function generateId() {
  return crypto.randomUUID();
}

function isWithin24Hours(dateStr: string, timeOfDay: string): boolean {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: BRISBANE_TZ })
  );
  const slotDate = new Date(dateStr + "T00:00:00");
  const startHour =
    SLOT_START_HOURS[timeOfDay as keyof typeof SLOT_START_HOURS] ?? 8;
  slotDate.setHours(startHour, 0, 0, 0);

  const hoursUntilSlot =
    (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilSlot < 24;
}

function isBeyondMaxDays(dateStr: string): boolean {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: BRISBANE_TZ })
  );
  const bookingDate = new Date(dateStr + "T00:00:00");
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + MAX_BOOKING_DAYS_AHEAD);
  return bookingDate > maxDate;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      mobile,
      address,
      returningCustomer,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      serviceType,
      scent,
      specialRequests,
      date,
      timeOfDay,
    } = body;

    // Validate required fields
    if (
      !name ||
      !mobile ||
      !address ||
      !vehicleYear ||
      !vehicleMake ||
      !vehicleModel ||
      !serviceType ||
      !scent ||
      !date ||
      !timeOfDay
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check 24-hour minimum notice
    if (isWithin24Hours(date, timeOfDay)) {
      return NextResponse.json(
        { error: "Bookings require at least 24 hours notice" },
        { status: 400 }
      );
    }

    // Check max days ahead
    if (isBeyondMaxDays(date)) {
      return NextResponse.json(
        { error: `Bookings cannot be made more than ${MAX_BOOKING_DAYS_AHEAD} days in advance` },
        { status: 400 }
      );
    }

    // Check if time slot is already taken by a booking
    const existingBooking = await db
      .select()
      .from(booking)
      .where(
        and(
          eq(booking.date, date),
          eq(booking.timeOfDay, timeOfDay),
          eq(booking.status, "pending")
        )
      )
      .limit(1);

    if (existingBooking.length > 0) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 409 }
      );
    }

    // Check if time slot is marked as unavailable
    const unavailable = await db
      .select()
      .from(unavailableSlot)
      .where(
        and(
          eq(unavailableSlot.date, date),
          or(
            eq(unavailableSlot.timeOfDay, timeOfDay),
            eq(unavailableSlot.timeOfDay, "all")
          )
        )
      )
      .limit(1);

    if (unavailable.length > 0) {
      return NextResponse.json(
        { error: "This time slot is not available" },
        { status: 409 }
      );
    }

    // Create booking
    const newBooking = await db
      .insert(booking)
      .values({
        id: generateId(),
        name,
        mobile: mobile.replace(/\s/g, ""),
        address,
        returningCustomer: returningCustomer ?? false,
        vehicleYear,
        vehicleMake,
        vehicleModel,
        serviceType,
        scent,
        specialRequests: specialRequests || null,
        date,
        timeOfDay,
        status: "pending",
      })
      .returning();

    // Send SMS notification (don't await to avoid blocking response)
    const smsMessage = generateBookingNotificationMessage({
      name,
      date,
      timeOfDay,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      serviceType,
      address,
      mobile: mobile.replace(/\s/g, ""),
      scent,
      specialRequests: specialRequests || null,
      returningCustomer: returningCustomer ?? false,
    });
    sendSMS(smsMessage).catch((err) =>
      console.error("SMS notification failed:", err)
    );

    return NextResponse.json({ booking: newBooking[0] }, { status: 201 });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// Get taken bookings and unavailable slots for calendar display
export async function GET() {
  try {
    const bookings = await db
      .select({
        date: booking.date,
        timeframe: booking.timeOfDay,
      })
      .from(booking)
      .where(eq(booking.status, "pending"));

    const unavailableSlots = await db
      .select({
        date: unavailableSlot.date,
        timeframe: unavailableSlot.timeOfDay,
      })
      .from(unavailableSlot);

    // Combine and deduplicate - expand "all" to both morning and afternoon
    const allBlocked = [...bookings];
    for (const slot of unavailableSlots) {
      if (slot.timeframe === "all") {
        allBlocked.push({ date: slot.date, timeframe: "morning" });
        allBlocked.push({ date: slot.date, timeframe: "afternoon" });
      } else {
        allBlocked.push(slot);
      }
    }

    return NextResponse.json({ bookings: allBlocked });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
