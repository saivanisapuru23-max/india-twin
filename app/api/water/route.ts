import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        {
          error: "Latitude and longitude are required.",
        },
        { status: 400 }
      );
    }

    const latitude = Number(lat);
    const longitude = Number(lon);

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          error: "Invalid coordinates.",
        },
        { status: 400 }
      );
    }

    const url = new URL(
      "https://api.open-meteo.com/v1/forecast"
    );

    url.searchParams.set(
      "latitude",
      String(latitude)
    );

    url.searchParams.set(
      "longitude",
      String(longitude)
    );

    url.searchParams.set(
      "daily",
      [
        "precipitation_sum",
        "precipitation_probability_max",
      ].join(",")
    );

    url.searchParams.set(
      "forecast_days",
      "7"
    );

    url.searchParams.set(
      "timezone",
      "auto"
    );

    const response = await fetch(
      url.toString(),
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "Water data service is temporarily unavailable.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    const rainfall =
      data.daily?.precipitation_sum || [];

    const probabilities =
      data.daily
        ?.precipitation_probability_max || [];

    const totalRainfall =
      rainfall.reduce(
        (total: number, value: number) =>
          total + (Number(value) || 0),
        0
      );

    const averageRainfall =
      rainfall.length > 0
        ? totalRainfall / rainfall.length
        : 0;

    const maxRainProbability =
      probabilities.length > 0
        ? Math.max(
            ...probabilities.map(
              (value: number) =>
                Number(value) || 0
            )
          )
        : 0;

    /*
      Short-term rainfall-based signal.

      This is NOT direct groundwater,
      reservoir or borewell measurement.
    */

    let risk = "Low";

    if (
      totalRainfall < 20 &&
      maxRainProbability < 60
    ) {
      risk = "Moderate";
    }

    if (
      totalRainfall < 10 &&
      maxRainProbability < 40
    ) {
      risk = "High";
    }

    let interpretation =
      "Forecast rainfall provides some short-term support for local water availability.";

    if (risk === "Moderate") {
      interpretation =
        "Rainfall signals are limited. Local water availability should be monitored.";
    }

    if (risk === "High") {
      interpretation =
        "Low rainfall signals may increase short-term water stress.";
    }

    return NextResponse.json({
      location: {
        latitude:
          data.latitude ?? latitude,

        longitude:
          data.longitude ?? longitude,

        timezone:
          data.timezone ?? "auto",
      },

      water: {
        sevenDayRainfall: Number(
          totalRainfall.toFixed(1)
        ),

        averageDailyRainfall: Number(
          averageRainfall.toFixed(1)
        ),

        maxRainProbability,

        risk,

        interpretation,
      },

      daily: {
        time:
          data.daily?.time || [],

        rainfall,

        rainProbability:
          probabilities,
      },
    });

  } catch (error) {
    console.error(
      "Water Intelligence API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to calculate water intelligence.",
      },
      { status: 500 }
    );
  }
}