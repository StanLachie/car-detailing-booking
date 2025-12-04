import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scent } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET - Admin route to get all scents
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scents = await db
      .select()
      .from(scent)
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

// POST - Admin route to create a scent
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Scent name is required" },
        { status: 400 }
      );
    }

    const newScent = await db
      .insert(scent)
      .values({
        id: nanoid(),
        name: name.trim(),
        enabled: true,
      })
      .returning();

    return NextResponse.json({ scent: newScent[0] });
  } catch (error: unknown) {
    console.error("Failed to create scent:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json(
        { error: "A scent with this name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create scent" },
      { status: 500 }
    );
  }
}

// PATCH - Admin route to toggle scent enabled/disabled
export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, enabled } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Scent ID is required" },
        { status: 400 }
      );
    }

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Enabled must be a boolean" },
        { status: 400 }
      );
    }

    await db
      .update(scent)
      .set({ enabled })
      .where(eq(scent.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update scent:", error);
    return NextResponse.json(
      { error: "Failed to update scent" },
      { status: 500 }
    );
  }
}

// DELETE - Admin route to delete a scent
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Scent ID is required" },
        { status: 400 }
      );
    }

    await db.delete(scent).where(eq(scent.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete scent:", error);
    return NextResponse.json(
      { error: "Failed to delete scent" },
      { status: 500 }
    );
  }
}
