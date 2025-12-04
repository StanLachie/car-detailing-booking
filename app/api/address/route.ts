import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 3) {
    return NextResponse.json({ features: [] });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Geoapify API key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${apiKey}&limit=5`
    );

    if (!response.ok) {
      throw new Error("Geoapify API request failed");
    }

    const data = await response.json();

    const addresses = data.features?.map((feature: {
      properties: {
        formatted: string;
        place_id: string;
      };
    }) => ({
      value: feature.properties.place_id,
      label: feature.properties.formatted,
    })) ?? [];

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Address autocomplete error:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}
