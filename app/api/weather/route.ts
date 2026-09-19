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
      "current",
      [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation",
        "weather_code",
        "wind_speed_10m",
      ].join(",")
    );

    url.searchParams.set(
      "daily",
      [
        "temperature_2m_max",
        "temperature_2m_min",
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
            "Weather service is temporarily unavailable.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,

      current: {
        temperature_2m:
          data.current?.temperature_2m ?? null,

        relative_humidity_2m:
          data.current?.relative_humidity_2m ?? null,

        apparent_temperature:
          data.current?.apparent_temperature ?? null,

        precipitation:
          data.current?.precipitation ?? null,

        weather_code:
          data.current?.weather_code ?? null,

        wind_speed_10m:
          data.current?.wind_speed_10m ?? null,
      },

      daily: {
        time:
          data.daily?.time ?? [],

        temperature_2m_max:
          data.daily?.temperature_2m_max ?? [],

        temperature_2m_min:
          data.daily?.temperature_2m_min ?? [],

        precipitation_sum:
          data.daily?.precipitation_sum ?? [],

        precipitation_probability_max:
          data.daily
            ?.precipitation_probability_max ?? [],
      },
    });
  } catch (error) {
    console.error(
      "Weather API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve weather data.",
      },
      { status: 500 }
    );
  }
}