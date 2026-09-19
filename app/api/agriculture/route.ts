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
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "precipitation_probability_max",
        "et0_fao_evapotranspiration",
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
            "Agriculture data service is temporarily unavailable.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    const daily = data.daily || {};

    const temperatures =
      daily.temperature_2m_max || [];

    const rainfall =
      daily.precipitation_sum || [];

    const probabilities =
      daily.precipitation_probability_max || [];

    const evapotranspiration =
      daily.et0_fao_evapotranspiration || [];

    const totalRainfall =
      rainfall.reduce(
        (total: number, value: number) =>
          total + (Number(value) || 0),
        0
      );

    const averageTemperature =
      temperatures.length > 0
        ? temperatures.reduce(
            (total: number, value: number) =>
              total + (Number(value) || 0),
            0
          ) / temperatures.length
        : 0;

    const averageRainProbability =
      probabilities.length > 0
        ? probabilities.reduce(
            (total: number, value: number) =>
              total + (Number(value) || 0),
            0
          ) / probabilities.length
        : 0;

    const totalEvapotranspiration =
      evapotranspiration.reduce(
        (total: number, value: number) =>
          total + (Number(value) || 0),
        0
      );

    let cropCondition = "Favorable";

    if (
      averageTemperature > 38 ||
      totalRainfall < 10
    ) {
      cropCondition = "Needs attention";
    }

    if (
      averageTemperature > 42 ||
      totalRainfall < 5
    ) {
      cropCondition = "High stress";
    }

    let recommendation =
      "Monitor rainfall and soil moisture before making irrigation decisions.";

    if (totalRainfall >= 50) {
      recommendation =
        "Forecast rainfall is relatively strong. Monitor field drainage and avoid unnecessary irrigation.";
    } else if (
      totalRainfall >= 20 &&
      totalRainfall < 50
    ) {
      recommendation =
        "Moderate rainfall is expected. Plan irrigation around rainfall timing and crop stage.";
    } else if (totalRainfall < 20) {
      recommendation =
        "Forecast rainfall is limited. Monitor soil moisture and plan irrigation carefully.";
    }

    return NextResponse.json({
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
      },

      agriculture: {
        cropCondition,

        sevenDayRainfall: Number(
          totalRainfall.toFixed(1)
        ),

        averageTemperature: Number(
          averageTemperature.toFixed(1)
        ),

        averageRainProbability: Number(
          averageRainProbability.toFixed(1)
        ),

        evapotranspiration: Number(
          totalEvapotranspiration.toFixed(1)
        ),

        recommendation,
      },

      daily: {
        time: daily.time || [],

        temperatureMax:
          daily.temperature_2m_max || [],

        temperatureMin:
          daily.temperature_2m_min || [],

        rainfall:
          daily.precipitation_sum || [],

        rainProbability:
          daily.precipitation_probability_max || [],

        evapotranspiration:
          daily.et0_fao_evapotranspiration || [],
      },
    });
  } catch (error) {
    console.error(
      "Agriculture Intelligence API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to calculate agriculture intelligence.",
      },
      { status: 500 }
    );
  }
}