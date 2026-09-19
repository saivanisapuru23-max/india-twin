import { NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

export const runtime = "nodejs";

const region = process.env.AWS_REGION || "ap-south-1";
const modelId = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
const client = new BedrockRuntimeClient({ region });

function safeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeRisk(value: unknown) {
  const allowed = ["Low", "Moderate", "High"];
  return allowed.includes(String(value)) ? String(value) : "Moderate";
}

function extractJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("Bedrock returned invalid JSON");
  }
}

function localInsights(body: any) {
  const location = body?.location || {};
  const weather = body?.weather || {};
  const water = body?.water || {};
  const agriculture = body?.agriculture || {};
  const alerts = body?.alerts || {};

  const sevenDayRainfall = Number(
    water.sevenDayRainfall ?? agriculture.sevenDayRainfall ?? 0
  );
  const rainProbability = Number(
    water.rainProbability ?? agriculture.rainProbability ?? 0
  );
  const temperature = Number(weather.temperature ?? 0);
  const floodRisk = safeRisk(
    alerts?.summary?.floodRisk ?? alerts?.floodRisk ?? "Low"
  );
  const droughtRisk = safeRisk(
    alerts?.summary?.droughtRisk ?? alerts?.droughtRisk ?? "Low"
  );
  const heatRisk = safeRisk(
    alerts?.summary?.heatRisk ?? alerts?.heatRisk ?? (temperature >= 38 ? "High" : temperature >= 35 ? "Moderate" : "Low")
  );

  const waterRisk =
    sevenDayRainfall >= 80 ? "Low" : sevenDayRainfall >= 35 ? "Moderate" : "High";
  const cropCondition =
    sevenDayRainfall >= 50 && temperature < 35
      ? "Favorable"
      : sevenDayRainfall >= 20 && temperature < 38
        ? "Watch"
        : "Challenging";

  const risks = [floodRisk, droughtRisk, heatRisk];
  const overallRisk = risks.includes("High")
    ? "High"
    : risks.includes("Moderate") || waterRisk === "Moderate"
      ? "Moderate"
      : "Low";

  const insights: string[] = [];
  const actions: string[] = [];

  if (floodRisk === "High" || sevenDayRainfall >= 80) {
    insights.push("Forecast rainfall may increase short-term waterlogging or local flood exposure.");
    actions.push("Check drainage channels and low-lying areas before heavier rainfall periods.");
  } else if (waterRisk === "High") {
    insights.push("Forecast rainfall is limited, so short-term water stress may need attention.");
    actions.push("Review irrigation needs and available local water sources.");
  } else {
    insights.push("Forecast rainfall provides some short-term support for local water availability.");
    actions.push("Monitor local water assets and avoid unnecessary irrigation when rainfall is sufficient.");
  }

  if (cropCondition === "Favorable") {
    insights.push("Current forecast conditions provide a favorable short-term farming signal.");
    actions.push("Monitor field conditions and drainage while using local crop advisories for decisions.");
  } else if (cropCondition === "Watch") {
    insights.push("Farming conditions are mixed; rainfall and temperature should be monitored closely.");
    actions.push("Check crop and soil conditions regularly and adjust irrigation based on actual field needs.");
  } else {
    insights.push("Weather conditions indicate a challenging short-term farming signal.");
    actions.push("Use verified local agricultural advisories and inspect actual field conditions before action.");
  }

  if (heatRisk === "High" || temperature >= 38) {
    insights.push("High-temperature conditions may increase heat stress for people, livestock, and crops.");
    actions.push("Plan outdoor work around cooler periods and follow local heat-health guidance.");
  } else {
    insights.push(`Rain probability is about ${Math.round(rainProbability)}% for the available forecast period.`);
  }

  return {
    success: true,
    source: "IndiaTwin Intelligence Engine · Local fallback",
    location: {
      name: safeText(location.name, "Selected location"),
      state: safeText(location.state, "India"),
      district: safeText(location.district, ""),
    },
    summary: {
      overallRisk,
      waterRisk,
      cropCondition,
      floodRisk,
      droughtRisk,
      heatRisk,
    },
    insights: insights.slice(0, 5),
    actions: actions.slice(0, 4),
    dataUsed: {
      temperature: typeof weather.temperature === "number" ? weather.temperature : null,
      humidity: typeof weather.humidity === "number" ? weather.humidity : null,
      currentRainfall: typeof weather.rainfall === "number" ? weather.rainfall : null,
      wind: typeof weather.wind === "number" ? weather.wind : null,
      sevenDayRainfall: Number.isFinite(sevenDayRainfall) ? sevenDayRainfall : null,
      rainProbability: Number.isFinite(rainProbability) ? rainProbability : null,
      averageTemperature:
        typeof agriculture.averageTemperature === "number" ? agriculture.averageTemperature : null,
    },
    disclaimer:
      "Decision-support context based on available location and forecast signals. Not an official warning or professional diagnosis.",
  };
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const prompt = `You are IndiaTwin, an India-only digital twin decision-support assistant.
Analyze only the supplied location, weather, water, agriculture, and risk signals.
Do not invent sensor readings, government warnings, medical diagnoses, crop disease diagnoses, or eligibility decisions.
Treat forecast-based values as indicators, not official warnings.
Return ONLY valid JSON with this exact shape:
{
  "summary": {
    "overallRisk": "Low|Moderate|High",
    "waterRisk": "Low|Moderate|High",
    "cropCondition": "Favorable|Watch|Challenging",
    "floodRisk": "Low|Moderate|High",
    "droughtRisk": "Low|Moderate|High",
    "heatRisk": "Low|Moderate|High"
  },
  "insights": ["short practical insight 1", "short practical insight 2", "short practical insight 3"],
  "actions": ["practical action 1", "practical action 2"],
  "disclaimer": "short decision-support disclaimer"
}
Keep insights concise, practical, and specific to the selected Indian location.
DATA:
${JSON.stringify(body, null, 2)}`;

    const response = await client.send(
      new ConverseCommand({
        modelId,
        system: [{ text: "You are a careful environmental and agriculture decision-support analyst for Indian communities. Use only supplied data. Never fabricate missing values. Do not present forecasts as official emergency warnings." }],
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 700, temperature: 0.2 },
      })
    );

    const content = response.output?.message?.content || [];
    const textBlock = content.find(
      (item): item is { text: string } =>
        typeof item === "object" && item !== null && "text" in item && typeof item.text === "string"
    );

    if (!textBlock?.text) throw new Error("Bedrock returned an empty response");

    const parsed = extractJson(textBlock.text);
    const location = body.location || {};
    const weather = body.weather || {};
    const water = body.water || {};
    const agriculture = body.agriculture || {};

    return NextResponse.json({
      success: true,
      source: "Amazon Bedrock · Nova Lite",
      location: {
        name: safeText(location.name, "Selected location"),
        state: safeText(location.state, "India"),
        district: safeText(location.district, ""),
      },
      summary: {
        overallRisk: safeRisk(parsed?.summary?.overallRisk),
        waterRisk: safeRisk(parsed?.summary?.waterRisk),
        cropCondition: safeText(parsed?.summary?.cropCondition, "Watch"),
        floodRisk: safeRisk(parsed?.summary?.floodRisk),
        droughtRisk: safeRisk(parsed?.summary?.droughtRisk),
        heatRisk: safeRisk(parsed?.summary?.heatRisk),
      },
      insights: Array.isArray(parsed?.insights) ? parsed.insights.filter((x: unknown) => typeof x === "string").slice(0, 5) : [],
      actions: Array.isArray(parsed?.actions) ? parsed.actions.filter((x: unknown) => typeof x === "string").slice(0, 4) : [],
      dataUsed: {
        temperature: typeof weather.temperature === "number" ? weather.temperature : null,
        humidity: typeof weather.humidity === "number" ? weather.humidity : null,
        currentRainfall: typeof weather.rainfall === "number" ? weather.rainfall : null,
        wind: typeof weather.wind === "number" ? weather.wind : null,
        sevenDayRainfall: typeof water.sevenDayRainfall === "number" ? water.sevenDayRainfall : typeof agriculture.sevenDayRainfall === "number" ? agriculture.sevenDayRainfall : null,
        rainProbability: typeof water.rainProbability === "number" ? water.rainProbability : typeof agriculture.rainProbability === "number" ? agriculture.rainProbability : null,
        averageTemperature: typeof agriculture.averageTemperature === "number" ? agriculture.averageTemperature : null,
      },
      disclaimer: safeText(parsed?.disclaimer, "AI-generated decision-support context based only on supplied forecast and location signals. Not an official warning or professional diagnosis."),
    });
  } catch (error) {
    console.error("Bedrock unavailable; using local IndiaTwin intelligence engine:", error);
    return NextResponse.json(localInsights(body));
  }
}
