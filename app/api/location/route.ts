import { NextRequest, NextResponse } from "next/server";

type LocationResult = {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  type: string;
  category: string;
  village: string;
  locality: string;
  town: string;
  city: string;
  district: string;
  state: string;
  country: string;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json(
        { error: "Please enter a location." },
        { status: 400 }
      );
    }

    const url = new URL(
      "https://nominatim.openstreetmap.org/search"
    );

    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "10");
    url.searchParams.set("countrycodes", "in");
    url.searchParams.set("accept-language", "en");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "IndiaTwin/1.0 (India digital twin project)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "Location service is temporarily unavailable.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    const results: LocationResult[] = data.map(
      (item: any, index: number) => {
        const address = item.address || {};

        return {
          id: `${item.place_id ?? index}`,

          name:
            address.village ||
            address.town ||
            address.city ||
            address.municipality ||
            address.suburb ||
            item.name ||
            query,

          displayName:
            item.display_name || query,

          lat: Number(item.lat),
          lon: Number(item.lon),

          type: item.type || "place",
          category: item.category || "place",

          village: address.village || "",

          locality:
            address.locality ||
            address.suburb ||
            "",

          town: address.town || "",

          city:
            address.city ||
            address.municipality ||
            "",

          district:
            address.district ||
            address.county ||
            address.state_district ||
            "",

          state: address.state || "",

          country:
            address.country || "India",
        };
      }
    );

    return NextResponse.json({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error(
      "Location search error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to search for this location.",
      },
      { status: 500 }
    );
  }
}