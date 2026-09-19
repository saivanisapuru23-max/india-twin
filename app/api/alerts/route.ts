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
        "temperature_2m_max",
        "temperature_2m_min",
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
            "Alert data service is temporarily unavailable.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    const daily = data.daily || {};

    const rainfall =
      daily.precipitation_sum || [];

    const rainProbability =
      daily.precipitation_probability_max || [];

    const maxTemperatures =
      daily.temperature_2m_max || [];

    const minTemperatures =
      daily.temperature_2m_min || [];

    const totalRainfall =
      rainfall.reduce(
        (total: number, value: number) =>
          total + (Number(value) || 0),
        0
      );

    const maximumRainfall =
      rainfall.length > 0
        ? Math.max(
            ...rainfall.map(
              (value: number) =>
                Number(value) || 0
            )
          )
        : 0;

    const maximumRainProbability =
      rainProbability.length > 0
        ? Math.max(
            ...rainProbability.map(
              (value: number) =>
                Number(value) || 0
            )
          )
        : 0;

    const maximumTemperature =
      maxTemperatures.length > 0
        ? Math.max(
            ...maxTemperatures.map(
              (value: number) =>
                Number(value) || 0
            )
          )
        : 0;

    const minimumTemperature =
      minTemperatures.length > 0
        ? Math.min(
            ...minTemperatures.map(
              (value: number) =>
                Number(value) || 0
            )
          )
        : 0;

    /*
      Flood signal

      This is a forecast-based indicator.
      It does not represent an official flood warning.
    */

    let floodRisk = "Low";

    if (
      totalRainfall >= 50 ||
      maximumRainfall >= 30
    ) {
      floodRisk = "Moderate";
    }

    if (
      totalRainfall >= 100 ||
      maximumRainfall >= 50
    ) {
      floodRisk = "High";
    }

    /*
      Drought / dry-spell signal

      This is a short-term weather signal,
      not an official drought classification.
    */

    let droughtRisk = "Low";

    if (
      totalRainfall < 20 &&
      maximumRainProbability < 60
    ) {
      droughtRisk = "Moderate";
    }

    if (
      totalRainfall < 10 &&
      maximumRainProbability < 40
    ) {
      droughtRisk = "High";
    }

    /*
      Heat signal
    */

    let heatRisk = "Low";

    if (maximumTemperature >= 38) {
      heatRisk = "Moderate";
    }

    if (maximumTemperature >= 42) {
      heatRisk = "High";
    }

    /*
      Overall alert level
    */

    let overallRisk = "Low";

    if (
      floodRisk === "Moderate" ||
      droughtRisk === "Moderate" ||
      heatRisk === "Moderate"
    ) {
      overallRisk = "Moderate";
    }

    if (
      floodRisk === "High" ||
      droughtRisk === "High" ||
      heatRisk === "High"
    ) {
      overallRisk = "High";
    }

    const alerts = [];

    if (floodRisk !== "Low") {
      alerts.push({
        type: "Flood",
        risk: floodRisk,
        message:
          floodRisk === "High"
            ? "Heavy rainfall signals may increase short-term flood risk."
            : "Rainfall signals may increase localized waterlogging or flood risk.",
      });
    }

    if (droughtRisk !== "Low") {
      alerts.push({
        type: "Drought",
        risk: droughtRisk,
        message:
          droughtRisk === "High"
            ? "Very limited rainfall signals may increase short-term dry-spell stress."
            : "Rainfall signals are limited; monitor local water availability.",
      });
    }

    if (heatRisk !== "Low") {
      alerts.push({
        type: "Heat",
        risk: heatRisk,
        message:
          heatRisk === "High"
            ? "High temperatures are forecast and may increase heat stress."
            : "Elevated temperatures are forecast for the selected location.",
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: "Weather",
        risk: "Low",
        message:
          "No major short-term weather risk signal was detected from the available forecast.",
      });
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

      summary: {
        overallRisk,

        floodRisk,

        droughtRisk,

        heatRisk,

        totalRainfall: Number(
          totalRainfall.toFixed(1)
        ),

        maximumRainfall: Number(
          maximumRainfall.toFixed(1)
        ),

        maximumRainProbability,

        maximumTemperature: Number(
          maximumTemperature.toFixed(1)
        ),

        minimumTemperature: Number(
          minimumTemperature.toFixed(1)
        ),
      },

      alerts,

      daily: {
        time:
          daily.time || [],

        rainfall,

        rainProbability,

        temperatureMax:
          maxTemperatures,

        temperatureMin:
          minTemperatures,
      },
    });
  } catch (error) {
    console.error(
      "Risk Alerts API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to calculate risk alerts.",
      },
      { status: 500 }
    );
  }
}