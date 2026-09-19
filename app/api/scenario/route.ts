import { NextRequest, NextResponse } from "next/server";

type ScenarioRequest = {
  scenario?: string;
  location?: {
    name?: string;
    district?: string;
    state?: string;
  };
  weather?: {
    temperature?: number;
    rainfall?: number;
  };
  water?: {
    risk?: string;
    sevenDayRainfall?: number;
  };
  agriculture?: {
    cropCondition?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body: ScenarioRequest = await request.json();

    const scenario = body.scenario || "normal";

    const locationName =
      body.location?.name || "Selected location";

    const district =
      body.location?.district || "";

    const state =
      body.location?.state || "India";

    const temperature =
      body.weather?.temperature ?? null;

    const rainfall =
      body.weather?.rainfall ?? null;

    const sevenDayRainfall =
      body.water?.sevenDayRainfall ?? null;

    const waterRisk =
      body.water?.risk || "Unknown";

    const cropCondition =
      body.agriculture?.cropCondition || "Unknown";

    let title = "Normal Conditions";

    let summary =
      "Current environmental conditions are being monitored.";

    let actions: string[] = [];

    if (scenario === "heavy-rain") {
      title = "Heavy Rain Scenario";

      summary =
        `${locationName} may experience increased rainfall pressure. Waterlogging, drainage and local infrastructure should be monitored.`;

      actions = [
        "Monitor low-lying areas and drainage channels.",
        "Avoid unnecessary irrigation when rainfall is expected.",
        "Check local roads and water-flow paths.",
        "Monitor crop fields for excess moisture.",
      ];
    }

    if (scenario === "low-rain") {
      title = "Low Rain Scenario";

      summary =
        `${locationName} may experience reduced rainfall availability. Water conservation and irrigation planning become more important.`;

      actions = [
        "Monitor soil moisture and local water availability.",
        "Plan irrigation around crop requirements.",
        "Prioritize water conservation.",
        "Consider crops suited to available water conditions.",
      ];
    }

    if (scenario === "heat") {
      title = "High Temperature Scenario";

      summary =
        `${locationName} may experience elevated temperature stress affecting water demand, agriculture and local activities.`;

      actions = [
        "Monitor water demand.",
        "Watch crop moisture conditions.",
        "Reduce unnecessary irrigation losses.",
        "Monitor vulnerable infrastructure and public areas.",
      ];
    }

    return NextResponse.json({
      success: true,

      scenario: {
        id: scenario,
        title,
        summary,
      },

      location: {
        name: locationName,
        district,
        state,
      },

      currentSignals: {
        temperature,
        rainfall,
        sevenDayRainfall,
        waterRisk,
        cropCondition,
      },

      recommendedActions: actions,

      disclaimer:
        "Scenario outputs are decision-support simulations based on available location and forecast signals. They are not official warnings.",
    });
  } catch (error) {
    console.error(
      "Scenario Intelligence API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate scenario analysis.",
      },
      { status: 500 }
    );
  }
}