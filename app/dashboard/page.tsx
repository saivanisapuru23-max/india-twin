"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DigitalTwinMap = dynamic(
  () => import("./map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[450px] items-center justify-center rounded-3xl bg-slate-100 text-sm text-slate-500">
        Loading map...
      </div>
    ),
  }
);

type WeatherData = {
  current: {
    temperature_2m: number | null;
    relative_humidity_2m: number | null;
    apparent_temperature: number | null;
    precipitation: number | null;
    weather_code: number | null;
    wind_speed_10m: number | null;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
};

type WaterData = {
  water: {
    sevenDayRainfall: number;
    averageDailyRainfall: number;
    maxRainProbability: number;
    risk: string;
    interpretation: string;
  };
};

type AgricultureData = {
  agriculture: {
    cropCondition: string;
    sevenDayRainfall: number;
    averageTemperature: number;
    averageRainProbability: number;
    evapotranspiration: number;
    recommendation: string;
  };
};

type AlertItem = {
  type: string;
  risk: string;
  message: string;
};

type AlertsData = {
  summary: {
    overallRisk: string;
    floodRisk: string;
    droughtRisk: string;
    heatRisk: string;
    totalRainfall: number;
    maximumRainfall: number;
    maximumRainProbability: number;
    maximumTemperature: number;
    minimumTemperature: number;
  };
  alerts: AlertItem[];
};

type AIInsightsData = {
  success: boolean;
  source: string;
  location: {
    name: string;
    state: string;
    district: string;
  };
  summary: {
    overallRisk: string;
    waterRisk: string;
    cropCondition: string;
    floodRisk: string;
    droughtRisk: string;
    heatRisk: string;
  };
  insights: string[];
  actions?: string[];
  dataUsed: {
    temperature: number | null;
    humidity: number | null;
    currentRainfall: number | null;
    wind: number | null;
    sevenDayRainfall: number | null;
    rainProbability: number | null;
    averageTemperature: number | null;
  };
  disclaimer: string;
};

function getWeatherDescription(
  code: number | null
) {
  if (code === null) return "Unavailable";

  if (code === 0) return "Clear sky";

  if ([1, 2, 3].includes(code))
    return "Partly cloudy";

  if ([45, 48].includes(code))
    return "Foggy";

  if ([51, 53, 55, 56, 57].includes(code))
    return "Drizzle";

  if ([61, 63, 65, 66, 67].includes(code))
    return "Rain";

  if ([71, 73, 75, 77].includes(code))
    return "Snow";

  if ([80, 81, 82].includes(code))
    return "Rain showers";

  if ([95, 96, 99].includes(code))
    return "Thunderstorm";

  return "Variable conditions";
}

function riskClass(risk: string) {
  if (risk === "High") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (risk === "Moderate") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function riskDot(risk: string) {
  if (risk === "High") {
    return "bg-red-500";
  }

  if (risk === "Moderate") {
    return "bg-amber-500";
  }

  return "bg-emerald-500";
}

function DashboardContent({ profile, onLogout }: { profile: { name: string; email: string }; onLogout: () => void }) {
  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [water, setWater] =
    useState<WaterData | null>(null);

  const [agriculture, setAgriculture] =
    useState<AgricultureData | null>(null);

  const [alerts, setAlerts] =
    useState<AlertsData | null>(null);

  const [aiInsights, setAIInsights] =
    useState<AIInsightsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [aiLoading, setAILoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [aiError, setAIError] =
    useState("");

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [voiceLanguage, setVoiceLanguage] =
    useState("en-IN");

  const [voiceText, setVoiceText] =
    useState("");

  const [voiceReply, setVoiceReply] =
    useState("");

  const [voiceListening, setVoiceListening] =
    useState(false);

  const [selectedLocation, setSelectedLocation] =
    useState({
      name: "India",
      displayName: "India",
      lat: 20.5937,
      lon: 78.9629,
      district: "",
      state: "",
    });

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const name =
      params.get("name") || "India";

    const displayName =
      params.get("displayName") || name;

    const lat =
      Number(params.get("lat")) ||
      20.5937;

    const lon =
      Number(params.get("lon")) ||
      78.9629;

    const district =
      params.get("district") || "";

    const state =
      params.get("state") || "";

    setSelectedLocation({
      name,
      displayName,
      lat,
      lon,
      district,
      state,
    });
  }, []);

  useEffect(() => {
    async function loadIntelligence() {
      try {
        setLoading(true);
        setError("");

        const query =
          `lat=${selectedLocation.lat}&lon=${selectedLocation.lon}`;

        const [
          weatherResponse,
          waterResponse,
          agricultureResponse,
          alertsResponse,
        ] = await Promise.all([
          fetch(`/api/weather?${query}`),
          fetch(`/api/water?${query}`),
          fetch(`/api/agriculture?${query}`),
          fetch(`/api/alerts?${query}`),
        ]);

        if (!weatherResponse.ok) {
          throw new Error(
            "Weather data unavailable"
          );
        }

        if (!waterResponse.ok) {
          throw new Error(
            "Water data unavailable"
          );
        }

        if (!agricultureResponse.ok) {
          throw new Error(
            "Agriculture data unavailable"
          );
        }

        if (!alertsResponse.ok) {
          throw new Error(
            "Risk alerts unavailable"
          );
        }

        const [
          weatherData,
          waterData,
          agricultureData,
          alertsData,
        ] = await Promise.all([
          weatherResponse.json(),
          waterResponse.json(),
          agricultureResponse.json(),
          alertsResponse.json(),
        ]);

        setWeather(weatherData);
        setWater(waterData);
        setAgriculture(
          agricultureData
        );
        setAlerts(alertsData);

        await generateAIInsights(
          weatherData,
          waterData,
          agricultureData,
          alertsData
        );
      } catch (err) {
        console.error(err);

        setError(
          "Some intelligence data could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    async function generateAIInsights(
      weatherData: WeatherData,
      waterData: WaterData,
      agricultureData: AgricultureData,
      alertsData: AlertsData
    ) {
      try {
        setAILoading(true);
        setAIError("");

        let response = await fetch(
          "/api/bedrock-insights",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              location: {
                name: selectedLocation.name,
                district:
                  selectedLocation.district,
                state: selectedLocation.state,
                lat: selectedLocation.lat,
                lon: selectedLocation.lon,
              },

              weather: {
                temperature:
                  weatherData.current
                    .temperature_2m,

                humidity:
                  weatherData.current
                    .relative_humidity_2m,

                rainfall:
                  weatherData.current
                    .precipitation,

                wind:
                  weatherData.current
                    .wind_speed_10m,
              },

              water: {
                risk:
                  waterData.water.risk,

                sevenDayRainfall:
                  waterData.water
                    .sevenDayRainfall,

                rainProbability:
                  waterData.water
                    .maxRainProbability,
              },

              agriculture: {
                cropCondition:
                  agricultureData
                    .agriculture
                    .cropCondition,

                sevenDayRainfall:
                  agricultureData
                    .agriculture
                    .sevenDayRainfall,

                averageTemperature:
                  agricultureData
                    .agriculture
                    .averageTemperature,

                rainProbability:
                  agricultureData
                    .agriculture
                    .averageRainProbability,

                evapotranspiration:
                  agricultureData
                    .agriculture
                    .evapotranspiration,
              },

              alerts: {
                overallRisk:
                  alertsData.summary
                    .overallRisk,

                floodRisk:
                  alertsData.summary
                    .floodRisk,

                droughtRisk:
                  alertsData.summary
                    .droughtRisk,

                heatRisk:
                  alertsData.summary
                    .heatRisk,
              },
            }),
          }
        );

        if (!response.ok) {
          response = await fetch(
            "/api/ai-insights",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                location: {
                  name: selectedLocation.name,
                  district: selectedLocation.district,
                  state: selectedLocation.state,
                  lat: selectedLocation.lat,
                  lon: selectedLocation.lon,
                },
                weather: {
                  temperature: weatherData.current.temperature_2m,
                  humidity: weatherData.current.relative_humidity_2m,
                  rainfall: weatherData.current.precipitation,
                  wind: weatherData.current.wind_speed_10m,
                },
                water: {
                  risk: waterData.water.risk,
                  sevenDayRainfall: waterData.water.sevenDayRainfall,
                  rainProbability: waterData.water.maxRainProbability,
                },
                agriculture: {
                  cropCondition: agricultureData.agriculture.cropCondition,
                  sevenDayRainfall: agricultureData.agriculture.sevenDayRainfall,
                  averageTemperature: agricultureData.agriculture.averageTemperature,
                  rainProbability: agricultureData.agriculture.averageRainProbability,
                  evapotranspiration: agricultureData.agriculture.evapotranspiration,
                },
                alerts: {
                  overallRisk: alertsData.summary.overallRisk,
                  floodRisk: alertsData.summary.floodRisk,
                  droughtRisk: alertsData.summary.droughtRisk,
                  heatRisk: alertsData.summary.heatRisk,
                },
              }),
            }
          );
        }

        if (!response.ok) {
          throw new Error(
            "AI insights unavailable"
          );
        }

        const data = await response.json();
        setAIInsights(data);
      } catch (err) {
        console.error(
          "AI insight error:",
          err
        );

        setAIError(
          "AI insights could not be generated."
        );
      } finally {
        setAILoading(false);
      }
    }

    loadIntelligence();
  }, [
    selectedLocation.lat,
    selectedLocation.lon,
    selectedLocation.name,
    selectedLocation.district,
    selectedLocation.state,
  ]);

  const buildVoiceReply = (text: string) => {
    const query = text.toLowerCase();
    const location = selectedLocation.displayName || selectedLocation.name;
    const temp = weather?.current.temperature_2m;
    const humidity = weather?.current.relative_humidity_2m;
    const rainfall = water?.water?.sevenDayRainfall;
    const waterRisk = water?.water?.risk || "Unknown";
    const crop = agriculture?.agriculture?.cropCondition || "Unknown";
    const flood = alerts?.summary?.floodRisk || "Unknown";

    if (voiceLanguage === "te-IN") {
      if (query.includes("weather") || query.includes("వాతావరణం") || query.includes("temperature"))
        return `${location} లో ప్రస్తుతం ఉష్ణోగ్రత ${temp ?? "అందుబాటులో లేదు"} డిగ్రీలు, humidity ${humidity ?? "అందుబాటులో లేదు"} శాతం.`;
      if (query.includes("water") || query.includes("నీరు"))
        return `${location} కి short-term water risk ${waterRisk}. వచ్చే 7 రోజుల్లో forecast rainfall సుమారు ${rainfall ?? "అందుబాటులో లేదు"} millimeters.`;
      if (query.includes("crop") || query.includes("పంట"))
        return `${location} కోసం ప్రస్తుత short-term agriculture signal ${crop}. వర్షపాతం మరియు field conditions ని గమనించండి.`;
      if (query.includes("flood") || query.includes("వరద"))
        return `${location} కి current forecast-based flood signal ${flood}. ఇది official emergency warning కాదు.`;
      return `IndiaTwin లో ${location} గురించి అడిగిన ప్రశ్నను weather, water, crop లేదా flood గురించి మరింత specific గా అడగవచ్చు.`;
    }

    if (voiceLanguage === "hi-IN") {
      if (query.includes("weather") || query.includes("मौसम") || query.includes("temperature"))
        return `${location} में अभी तापमान ${temp ?? "उपलब्ध नहीं"} डिग्री और humidity ${humidity ?? "उपलब्ध नहीं"} प्रतिशत है।`;
      if (query.includes("water") || query.includes("पानी"))
        return `${location} का short-term water risk ${waterRisk} है। अगले 7 दिनों की forecast rainfall लगभग ${rainfall ?? "उपलब्ध नहीं"} millimeters है।`;
      if (query.includes("crop") || query.includes("फसल"))
        return `${location} के लिए short-term agriculture signal ${crop} है।`;
      if (query.includes("flood") || query.includes("बाढ़"))
        return `${location} का forecast-based flood signal ${flood} है। यह official emergency warning नहीं है।`;
      return `IndiaTwin में ${location} के weather, water, crop या flood के बारे में सवाल पूछें।`;
    }

    if (voiceLanguage === "ta-IN") {
      if (query.includes("weather") || query.includes("வானிலை") || query.includes("temperature"))
        return `${location} பகுதியில் தற்போதைய வெப்பநிலை ${temp ?? "கிடைக்கவில்லை"} டிகிரி, humidity ${humidity ?? "கிடைக்கவில்லை"} சதவீதம்.`;
      if (query.includes("water") || query.includes("தண்ணீர்"))
        return `${location} பகுதியில் short-term water risk ${waterRisk}. அடுத்த 7 நாட்களின் மழை forecast ${rainfall ?? "கிடைக்கவில்லை"} millimeters.`;
      if (query.includes("crop") || query.includes("பயிர்"))
        return `${location} க்கான short-term agriculture signal ${crop}.`;
      if (query.includes("flood") || query.includes("வெள்ளம்"))
        return `${location} க்கான forecast-based flood signal ${flood}. இது official emergency warning அல்ல.`;
      return `IndiaTwin-ல் ${location} பற்றிய weather, water, crop அல்லது flood கேள்வியை கேளுங்கள்.`;
    }

    if (voiceLanguage === "mr-IN") {
      if (query.includes("weather") || query.includes("हवामान") || query.includes("temperature"))
        return `${location} मध्ये सध्याचे तापमान ${temp ?? "उपलब्ध नाही"} अंश आणि humidity ${humidity ?? "उपलब्ध नाही"} टक्के आहे.`;
      if (query.includes("water") || query.includes("पाणी"))
        return `${location} साठी short-term water risk ${waterRisk} आहे. पुढील 7 दिवसांचा rainfall forecast ${rainfall ?? "उपलब्ध नाही"} millimeters आहे.`;
      if (query.includes("crop") || query.includes("पीक"))
        return `${location} साठी short-term agriculture signal ${crop} आहे.`;
      if (query.includes("flood") || query.includes("पूर"))
        return `${location} साठी forecast-based flood signal ${flood} आहे. हे official emergency warning नाही.`;
      return `IndiaTwin मध्ये ${location} च्या weather, water, crop किंवा flood बद्दल प्रश्न विचारा.`;
    }

    if (voiceLanguage === "bn-IN") {
      if (query.includes("weather") || query.includes("আবহাওয়া") || query.includes("temperature"))
        return `${location}-এ বর্তমান তাপমাত্রা ${temp ?? "পাওয়া যায়নি"} ডিগ্রি এবং humidity ${humidity ?? "পাওয়া যায়নি"} শতাংশ।`;
      if (query.includes("water") || query.includes("জল"))
        return `${location}-এর short-term water risk ${waterRisk}। আগামী 7 দিনের rainfall forecast ${rainfall ?? "পাওয়া যায়নি"} millimeters।`;
      if (query.includes("crop") || query.includes("ফসল"))
        return `${location}-এর short-term agriculture signal ${crop}।`;
      if (query.includes("flood") || query.includes("বন্যা"))
        return `${location}-এর forecast-based flood signal ${flood}। এটি official emergency warning নয়।`;
      return `IndiaTwin-এ ${location} এর weather, water, crop বা flood সম্পর্কে প্রশ্ন করুন।`;
    }

    if (query.includes("weather") || query.includes("temperature"))
      return `For ${location}, the current temperature is ${temp ?? "not available"} degrees with ${humidity ?? "not available"}% humidity.`;
    if (query.includes("water"))
      return `For ${location}, the short-term water risk is ${waterRisk}. Forecast rainfall for the next 7 days is about ${rainfall ?? "not available"} millimeters.`;
    if (query.includes("crop") || query.includes("agriculture"))
      return `For ${location}, the current short-term agriculture signal is ${crop}.`;
    if (query.includes("flood"))
      return `For ${location}, the forecast-based flood signal is ${flood}. This is not an official emergency warning.`;
    return `Ask me about the weather, water risk, crops, or flood signals for ${location}.`;
  };

  const speakVoiceReply = (reply: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.lang = voiceLanguage;
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const askVoiceAssistant = () => {
    if (!voiceText.trim()) return;
    const reply = buildVoiceReply(voiceText);
    setVoiceReply(reply);
    speakVoiceReply(reply);
  };

  const startVoiceListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceReply("Voice recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = voiceLanguage;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setVoiceListening(true);
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => {
      setVoiceListening(false);
      setVoiceReply("I could not hear that clearly. Please try again.");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setVoiceText(transcript);
      const reply = buildVoiceReply(transcript);
      setVoiceReply(reply);
      speakVoiceReply(reply);
    };
    recognition.start();
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">

      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">

          <div className="border-b border-slate-200 px-6 py-6">

            <a
              href="/"
              className="text-xl font-bold tracking-tight"
            >
              IndiaTwin
            </a>

            <p className="mt-1 text-xs text-slate-500">
              AI-Powered Digital Twin
            </p>

          </div>

          <nav className="flex-1 px-3 py-5">

            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Workspace
            </p>

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="mb-4 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                S
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">Profile</span>
                <span className="block text-[11px] text-slate-400">View account</span>
              </span>
            </button>

            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Intelligence
            </p>

            <NavItem
              icon="⌂"
              label="Overview"
              href="#overview"
              active
            />

            <NavItem
              icon="◉"
              label="Map"
              href="#map"
            />

            <NavItem
              icon="☁"
              label="Weather"
              href="#weather"
            />

            <NavItem
              icon="≈"
              label="Water"
              href="#water"
            />

            <NavItem
              icon="⌁"
              label="Agriculture"
              href="#agriculture"
            />

            <NavItem
              icon="🌾"
              label="Farmer Mode"
              href="#farmer"
            />

            <NavItem
              icon="🏛️"
              label="Government Schemes"
              href="#schemes"
            />

            <NavItem
              icon="🏘️"
              label="Panchayat Dashboard"
              href="#panchayat"
            />

            <NavItem
              icon="🎙️"
              label="Voice Assistant"
              href="#voice"
            />

            <NavItem
              icon="!"
              label="Alerts"
              href="#alerts"
            />

            <NavItem
              icon="✦"
              label="AI Insights"
              href="#ai-insights"
            />

          </nav>

          <div className="border-t border-slate-200 p-4">

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                INDIA ONLY
              </p>

              <p className="mt-2 text-sm leading-5 text-slate-600">
                Digital intelligence for Indian communities.
              </p>

            </div>

          </div>

        </aside>

        {/* MAIN */}

        <div className="min-w-0 flex-1">

          {/* TOP BAR */}

          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">

            <div className="flex h-16 items-center justify-between px-5 sm:px-8">

              <div>

                <p className="text-xs font-medium text-slate-400">
                  Digital Twin
                </p>

                <h1 className="text-lg font-semibold">
                  {selectedLocation.name}
                </h1>

              </div>

              <div className="relative flex items-center gap-3">

                <a
                  href="/"
                  className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
                >
                  Change location
                </a>

                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  aria-expanded={profileOpen}
                  aria-label="Open profile"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    S
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-xs font-semibold text-slate-900">
                      {profile.name}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {profile.email}
                    </span>
                  </span>
                  <span className="text-xs text-slate-400">⌄</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 font-semibold text-white">
                        S
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {profile.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {profile.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Current Twin
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {selectedLocation.name}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl border border-slate-100 p-3">
                          <p className="text-slate-400">Role</p>
                          <p className="mt-1 font-semibold text-slate-700">Builder</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 p-3">
                          <p className="text-slate-400">Region</p>
                          <p className="mt-1 font-semibold text-slate-700">India</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={onLogout}
                        className="w-full rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </header>

          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

            {/* LOCATION */}

            <section id="overview" className="mb-8">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

                <div>

                  <p className="text-sm text-slate-500">
                    {selectedLocation.displayName}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {selectedLocation.state && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {selectedLocation.state}
                      </span>
                    )}

                    {selectedLocation.district && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        District:{" "}
                        {selectedLocation.district}
                      </span>
                    )}

                  </div>

                </div>

                <div className="text-left md:text-right">

                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Coordinates
                  </p>

                  <p className="mt-1 font-mono text-sm text-slate-600">
                    {selectedLocation.lat.toFixed(5)},{" "}
                    {selectedLocation.lon.toFixed(5)}
                  </p>

                </div>

              </div>

            </section>

            {error && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                {error}
              </div>
            )}

            {/* QUICK METRICS */}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <MetricCard
                label="Temperature"
                value={
                  weather?.current
                    .temperature_2m !== null &&
                  weather?.current
                    .temperature_2m !== undefined
                    ? `${Math.round(
                        weather.current
                          .temperature_2m
                      )}°C`
                    : "—"
                }
                note="Current"
                icon="☀"
              />

              <MetricCard
                label="Humidity"
                value={
                  weather?.current
                    .relative_humidity_2m !== null &&
                  weather?.current
                    .relative_humidity_2m !== undefined
                    ? `${Math.round(
                        weather.current
                          .relative_humidity_2m
                      )}%`
                    : "—"
                }
                note="Relative humidity"
                icon="◌"
              />

              <MetricCard
                label="Rainfall"
                value={
                  weather?.current
                    .precipitation !== null &&
                  weather?.current
                    .precipitation !== undefined
                    ? `${weather.current.precipitation} mm`
                    : "—"
                }
                note="Current precipitation"
                icon="≈"
              />

              <MetricCard
                label="Wind"
                value={
                  weather?.current
                    .wind_speed_10m !== null &&
                  weather?.current
                    .wind_speed_10m !== undefined
                    ? `${Math.round(
                        weather.current
                          .wind_speed_10m
                      )} km/h`
                    : "—"
                }
                note="Wind speed"
                icon="↝"
              />

            </section>

            {/* MAP + WEATHER */}

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">

                <div className="border-b border-slate-200 px-6 py-5">

                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Geographic Twin
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Interactive map
                  </h2>

                </div>

                <div className="h-[450px]">

                  <DigitalTwinMap
                    lat={selectedLocation.lat}
                    lon={selectedLocation.lon}
                    name={selectedLocation.name}
                  />

                </div>

              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6">

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Weather Intelligence
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Current conditions
                </h2>

                {loading ? (
                  <LoadingBlock />
                ) : (
                  <div className="mt-7 space-y-5">

                    <div>

                      <p className="text-5xl font-semibold tracking-tight">
                        {weather?.current
                          .temperature_2m ?? "—"}°
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {getWeatherDescription(
                          weather?.current
                            .weather_code ??
                            null
                        )}
                      </p>

                    </div>

                    <div className="grid grid-cols-2 gap-3">

                      <WeatherDetail
                        label="Feels like"
                        value={
                          weather?.current
                            .apparent_temperature !==
                            null &&
                          weather?.current
                            .apparent_temperature !==
                            undefined
                            ? `${weather.current.apparent_temperature}°C`
                            : "—"
                        }
                      />

                      <WeatherDetail
                        label="Humidity"
                        value={
                          weather?.current
                            .relative_humidity_2m !==
                            null &&
                          weather?.current
                            .relative_humidity_2m !==
                            undefined
                            ? `${weather.current.relative_humidity_2m}%`
                            : "—"
                        }
                      />

                      <WeatherDetail
                        label="Rain"
                        value={
                          weather?.current
                            .precipitation !==
                            null &&
                          weather?.current
                            .precipitation !==
                            undefined
                            ? `${weather.current.precipitation} mm`
                            : "—"
                        }
                      />

                      <WeatherDetail
                        label="Wind"
                        value={
                          weather?.current
                            .wind_speed_10m !==
                            null &&
                          weather?.current
                            .wind_speed_10m !==
                            undefined
                            ? `${weather.current.wind_speed_10m} km/h`
                            : "—"
                        }
                      />

                    </div>

                    <div className="border-t border-slate-100 pt-5">

                      <p className="text-xs text-slate-400">
                        Region
                      </p>

                      <p className="mt-1 font-medium">
                        {selectedLocation.state ||
                          "India"}
                      </p>

                    </div>

                  </div>
                )}

              </div>

            </section>

            {/* WATER */}

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">

              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Water Intelligence
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Short-term water risk signal
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Rainfall and precipitation signals are analyzed to estimate short-term water stress for the selected location.
                  </p>

                </div>

                {water && (
                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${riskClass(
                      water.water.risk
                    )}`}
                  >
                    Risk:{" "}
                    {water.water.risk}
                  </span>
                )}

              </div>

              {loading ? (
                <LoadingBlock />
              ) : water ? (
                <>

                  <div className="mt-7 grid gap-4 md:grid-cols-3">

                    <WaterMetric
                      label="7-day rainfall"
                      value={`${water.water.sevenDayRainfall} mm`}
                      note="Forecast rainfall"
                    />

                    <WaterMetric
                      label="Average daily rainfall"
                      value={`${water.water.averageDailyRainfall} mm`}
                      note="7-day average"
                    />

                    <WaterMetric
                      label="Rain probability"
                      value={`${water.water.maxRainProbability}%`}
                      note="Maximum forecast chance"
                    />

                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[0.4fr_1fr]">

                    <div className="rounded-2xl bg-slate-50 p-5">

                      <p className="text-xs text-slate-400">
                        Water risk
                      </p>

                      <div className="mt-3 flex items-center gap-3">

                        <span
                          className={`h-3 w-3 rounded-full ${riskDot(
                            water.water.risk
                          )}`}
                        />

                        <span className="text-2xl font-semibold">
                          {water.water.risk}
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Short-term signal
                      </p>

                    </div>

                    <div className="rounded-2xl border border-slate-100 p-5">

                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Intelligence interpretation
                      </p>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {water.water.interpretation}
                      </p>

                      <p className="mt-4 text-xs leading-5 text-slate-400">
                        This is a rainfall-based short-term indicator, not a direct groundwater or reservoir measurement.
                      </p>

                    </div>

                  </div>

                </>
              ) : null}

            </section>

            {/* AGRICULTURE */}

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Agriculture Intelligence
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Crop and farming conditions
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Weather and rainfall signals are analyzed to provide a short-term agriculture planning signal.
                </p>

              </div>

              {loading ? (
                <LoadingBlock />
              ) : agriculture ? (
                <>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <AgricultureMetric
                      label="7-day rainfall"
                      value={`${agriculture.agriculture.sevenDayRainfall} mm`}
                      note="Forecast rainfall"
                    />

                    <AgricultureMetric
                      label="Average temperature"
                      value={`${agriculture.agriculture.averageTemperature}°C`}
                      note="7-day forecast average"
                    />

                    <AgricultureMetric
                      label="Rain probability"
                      value={`${agriculture.agriculture.averageRainProbability}%`}
                      note="Average forecast chance"
                    />

                    <AgricultureMetric
                      label="Evapotranspiration"
                      value={`${agriculture.agriculture.evapotranspiration} mm`}
                      note="Estimated 7-day ET₀"
                    />

                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[0.4fr_1fr]">

                    <div className="rounded-2xl bg-slate-50 p-5">

                      <p className="text-xs text-slate-400">
                        Crop condition
                      </p>

                      <p className="mt-2 text-2xl font-semibold">
                        {
                          agriculture
                            .agriculture
                            .cropCondition
                        }
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Short-term weather signal
                      </p>

                    </div>

                    <div className="rounded-2xl border border-slate-100 p-5">

                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Farming planning signal
                      </p>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {
                          agriculture
                            .agriculture
                            .recommendation
                        }
                      </p>

                      <p className="mt-4 text-xs leading-5 text-slate-400">
                        This signal uses forecast weather conditions and is not a crop-disease diagnosis or field-level measurement.
                      </p>

                    </div>

                  </div>

                  <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">

                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      IndiaTwin insight
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Combining weather and rainfall signals creates a starting point for future crop recommendations.
                    </p>

                  </div>

                </>
              ) : null}

            </section>

            {/* ALERTS */}

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Risk Alerts
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Flood, drought & weather signals
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Forecast data is analyzed to identify short-term environmental risk signals for the selected location.
                  </p>

                </div>

                {alerts && (
                  <span
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${riskClass(
                      alerts.summary
                        .overallRisk
                    )}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${riskDot(
                        alerts.summary
                          .overallRisk
                      )}`}
                    />

                    Overall risk:{" "}
                    {
                      alerts.summary
                        .overallRisk
                    }

                  </span>
                )}

              </div>

              {loading ? (
                <LoadingBlock />
              ) : alerts ? (
                <>

                  <div className="mt-7 grid gap-4 md:grid-cols-3">

                    <RiskCard
                      title="Flood"
                      risk={
                        alerts.summary
                          .floodRisk
                      }
                      icon="!"
                    />

                    <RiskCard
                      title="Drought"
                      risk={
                        alerts.summary
                          .droughtRisk
                      }
                      icon="≈"
                    />

                    <RiskCard
                      title="Heat"
                      risk={
                        alerts.summary
                          .heatRisk
                      }
                      icon="☀"
                    />

                  </div>

                  <div className="mt-6">

                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Detected signals
                    </p>

                    <div className="mt-3 space-y-3">

                      {alerts.alerts.map(
                        (alert, index) => (
                          <div
                            key={`${alert.type}-${index}`}
                            className={`rounded-2xl border p-4 ${riskClass(
                              alert.risk
                            )}`}
                          >

                            <div className="flex items-start gap-3">

                              <span
                                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${riskDot(
                                  alert.risk
                                )}`}
                              />

                              <div>

                                <div className="flex flex-wrap items-center gap-2">

                                  <p className="font-semibold">
                                    {alert.type} risk
                                  </p>

                                  <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-semibold uppercase">
                                    {alert.risk}
                                  </span>

                                </div>

                                <p className="mt-1 text-sm leading-6">
                                  {alert.message}
                                </p>

                              </div>

                            </div>

                          </div>
                        )
                      )}

                    </div>

                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <SignalMetric
                      label="7-day rainfall"
                      value={`${alerts.summary.totalRainfall} mm`}
                    />

                    <SignalMetric
                      label="Maximum daily rainfall"
                      value={`${alerts.summary.maximumRainfall} mm`}
                    />

                    <SignalMetric
                      label="Maximum rain probability"
                      value={`${alerts.summary.maximumRainProbability}%`}
                    />

                    <SignalMetric
                      label="Maximum temperature"
                      value={`${alerts.summary.maximumTemperature}°C`}
                    />

                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">

                    <p className="text-xs leading-5 text-slate-500">
                      Risk Alerts are forecast-based indicators generated from available weather data. They are not official flood, drought, heat or emergency warnings.
                    </p>

                  </div>

                </>
              ) : null}

            </section>

            {/* AI INSIGHTS */}

            <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">

              <div className="border-b border-slate-200 bg-slate-900 px-6 py-7 text-white sm:px-7">

                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      AI Intelligence
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold">
                      Location Intelligence
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                      IndiaTwin combines location, weather, water, agriculture and risk signals to generate practical insights for the selected region.
                    </p>

                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Intelligence active
                    </span>
                    {aiInsights?.source ? (
                      <span className="inline-flex w-fit items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                        {aiInsights.source}
                      </span>
                    ) : null}
                  </div>

                </div>

              </div>

              <div className="p-6 sm:p-7">

                {aiLoading ? (
                  <div className="rounded-2xl bg-slate-50 p-6">

                    <p className="text-sm font-medium text-slate-600">
                      Analyzing location signals...
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Combining weather, water, agriculture and risk data.
                    </p>

                  </div>
                ) : aiError ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
                    {aiError}
                  </div>
                ) : aiInsights ? (
                  <>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                      <AIStatusCard
                        label="Overall risk"
                        value={
                          aiInsights.summary
                            .overallRisk
                        }
                      />

                      <AIStatusCard
                        label="Water"
                        value={
                          aiInsights.summary
                            .waterRisk
                        }
                      />

                      <AIStatusCard
                        label="Agriculture"
                        value={
                          aiInsights.summary
                            .cropCondition
                        }
                      />

                      <AIStatusCard
                        label="Flood signal"
                        value={
                          aiInsights.summary
                            .floodRisk
                        }
                      />

                    </div>

                    <div className="mt-7">

                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Generated insights
                      </p>

                      <div className="mt-3 space-y-3">

                        {aiInsights.insights.map(
                          (insight, index) => (
                            <div
                              key={index}
                              className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
                            >

                              <div className="flex items-start gap-4">

                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm text-white">
                                  {index + 1}
                                </span>

                                <p className="text-sm leading-6 text-slate-600">
                                  {insight}
                                </p>

                              </div>

                            </div>
                          )
                        )}

                      </div>

                    </div>

                    {aiInsights.actions?.length ? (
                      <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                          Recommended actions
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {aiInsights.actions.map((action, index) => (
                            <div key={index} className="rounded-2xl border border-cyan-100 bg-white p-4 text-sm leading-6 text-slate-600">
                              <span className="mr-2 font-semibold text-cyan-700">{index + 1}.</span>
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-6 rounded-2xl border border-slate-100 p-5">

                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Data used
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <DataUsed
                          label="Temperature"
                          value={
                            aiInsights.dataUsed
                              .temperature !==
                              null
                              ? `${aiInsights.dataUsed.temperature}°C`
                              : "—"
                          }
                        />

                        <DataUsed
                          label="Humidity"
                          value={
                            aiInsights.dataUsed
                              .humidity !==
                              null
                              ? `${aiInsights.dataUsed.humidity}%`
                              : "—"
                          }
                        />

                        <DataUsed
                          label="7-day rainfall"
                          value={
                            aiInsights.dataUsed
                              .sevenDayRainfall !==
                              null
                              ? `${aiInsights.dataUsed.sevenDayRainfall} mm`
                              : "—"
                          }
                        />

                        <DataUsed
                          label="Rain probability"
                          value={
                            aiInsights.dataUsed
                              .rainProbability !==
                              null
                              ? `${aiInsights.dataUsed.rainProbability}%`
                              : "—"
                          }
                        />

                      </div>

                    </div>

                    <p className="mt-5 text-xs leading-5 text-slate-400">
                      {aiInsights.disclaimer}
                    </p>

                  </>
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-400">
                    AI insights will appear here.
                  </div>
                )}

              </div>

            </section>

            {/* FORECAST */}

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Weather Intelligence
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  7-day forecast
                </h2>

              </div>

              {loading ? (
                <LoadingBlock />
              ) : weather ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

                  {weather.daily.time.map(
                    (date, index) => (
                      <ForecastCard
                        key={date}
                        date={date}
                        high={
                          weather.daily
                            .temperature_2m_max[
                            index
                          ]
                        }
                        low={
                          weather.daily
                            .temperature_2m_min[
                            index
                          ]
                        }
                        rain={
                          weather.daily
                            .precipitation_sum[
                            index
                          ]
                        }
                        chance={
                          weather.daily
                            .precipitation_probability_max[
                            index
                          ]
                        }
                      />
                    )
                  )}

                </div>
              ) : null}

            </section>

            {/* LOCAL LANGUAGE VOICE ASSISTANT */}

            <section id="voice" className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">IndiaTwin Voice</p>
                  <h2 className="mt-1 text-xl font-semibold">Local Language Voice Assistant</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Ask about weather, water, crops, or flood signals for the selected location. Voice input and spoken responses use your browser's speech capabilities.</p>
                </div>
                <div className="w-full md:w-48">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Language</label>
                  <select value={voiceLanguage} onChange={(e) => setVoiceLanguage(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400">
                    <option value="en-IN">English</option>
                    <option value="te-IN">తెలుగు</option>
                    <option value="hi-IN">हिन्दी</option>
                    <option value="ta-IN">தமிழ்</option>
                    <option value="mr-IN">मराठी</option>
                    <option value="bn-IN">বাংলা</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Ask IndiaTwin</label>
                  <input value={voiceText} onChange={(e) => setVoiceText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") askVoiceAssistant(); }} placeholder="Ask: What is the weather here?" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
                </div>
                <div className="flex items-end gap-2">
                  <button type="button" onClick={startVoiceListening} className={`rounded-xl px-4 py-3 text-sm font-semibold text-white ${voiceListening ? "bg-red-600" : "bg-slate-900 hover:bg-slate-800"}`}>
                    {voiceListening ? "Listening…" : "🎙️ Speak"}
                  </button>
                  <button type="button" onClick={askVoiceAssistant} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Ask</button>
                </div>
              </div>

              {voiceReply && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">IndiaTwin response</p>
                    <button type="button" onClick={() => speakVoiceReply(voiceReply)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">🔊 Listen</button>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{voiceReply}</p>
                </div>
              )}

              <p className="mt-4 text-xs leading-5 text-slate-400">Browser speech recognition and speech synthesis are used in this prototype. Availability depends on the browser and device. The answers are generated from IndiaTwin's available location and forecast signals.</p>
            </section>

            {/* INTELLIGENCE CARDS */}

            <section className="mt-6">

              <div className="mb-5">

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  IndiaTwin Intelligence
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Understand your location
                </h2>

              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

                <IntelligenceCard
                  icon="≈"
                  title="Water"
                  text="Water availability and shortage risk."
                />

                <IntelligenceCard
                  icon="⌁"
                  title="Agriculture"
                  text="Crop conditions and seasonal opportunities."
                />

                <IntelligenceCard
                  icon="!"
                  title="Risk Alerts"
                  text="Flood, drought and weather risk signals."
                />

                <IntelligenceCard
                  icon="🏛️"
                  title="Government Schemes"
                  text="Discover official schemes and application guidance."
                />

                <IntelligenceCard
                  icon="🏘️"
                  title="Panchayat Dashboard"
                  text="Track community infrastructure and local action areas."
                />

                <IntelligenceCard
                  icon="🎙️"
                  title="Voice Assistant"
                  text="Ask location questions in English and Indian languages."
                />

                <IntelligenceCard
                  icon="🌾"
                  title="Farmer Mode"
                  text="Weather-based crop and irrigation planning."
                />

                <IntelligenceCard
                  icon="✦"
                  title="AI Insights"
                  text="AI-generated recommendations for this selected location."
                />

              </div>

            </section>

            {/* GOVERNMENT SCHEMES */}

            <section id="schemes" className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Government Schemes Intelligence
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    Official schemes worth checking for this community
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    IndiaTwin surfaces scheme categories that may be relevant to farmers, irrigation and rural water needs. Eligibility is not decided by IndiaTwin; verify the current criteria on the official government portal.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  Official sources
                </span>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">

                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Citizen scheme discovery
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        myScheme
                      </h3>
                    </div>
                    <span className="rounded-xl bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">India</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    A national platform for discovering government schemes using eligibility information and scheme filters.
                  </p>
                  <a href="https://www.myscheme.gov.in/" target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    Open myScheme ↗
                  </a>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Rural drinking water
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        Jal Jeevan Mission
                      </h3>
                    </div>
                    <span className="rounded-xl bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">Water</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Focuses on rural drinking-water supply, household tap connections and water-source sustainability.
                  </p>
                  <a href="https://jaljeevanmission.gov.in/" target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    Open official portal ↗
                  </a>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Irrigation & water efficiency
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        PMKSY
                      </h3>
                    </div>
                    <span className="rounded-xl bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Agriculture</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Pradhan Mantri Krishi Sinchayee Yojana supports irrigation access and efficient water use in agriculture.
                  </p>
                  <a href="https://pmksy.gov.in/" target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    Open official portal ↗
                  </a>
                </div>

              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  How IndiaTwin uses this layer
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">1 · Detect</p><p className="mt-1 text-sm text-slate-600">Connect location context with themes such as farming, irrigation and rural water.</p></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">2 · Explain</p><p className="mt-1 text-sm text-slate-600">Show why a scheme category may be relevant instead of claiming eligibility.</p></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">3 · Verify</p><p className="mt-1 text-sm text-slate-600">Send users to the official source for current eligibility and application steps.</p></div>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-400">
                Scheme information can change. IndiaTwin provides discovery and decision-support context only; official government portals control eligibility, benefits and application requirements.
              </p>

            </section>

            {/* FARMER MODE */}

            <section id="farmer" className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Farmer Mode
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Weather-based farm planning
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Practical crop and irrigation guidance based on the selected location's current and forecast weather signals.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Planning signal
                </span>

              </div>

              {loading || !weather || !agriculture ? (
                <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                  Loading farmer recommendations...
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">

                    <div className="rounded-2xl border border-slate-100 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Crop outlook
                      </p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">
                        {agriculture.agriculture.cropCondition}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Based on forecast temperature, rainfall and rain probability.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Irrigation guidance
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {agriculture.agriculture.sevenDayRainfall >= 60
                          ? "Rainfall is strong — avoid unnecessary irrigation."
                          : agriculture.agriculture.sevenDayRainfall <= 20
                            ? "Rainfall is limited — monitor soil moisture closely."
                            : "Use field conditions to decide irrigation frequency."}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        7-day forecast rainfall: {agriculture.agriculture.sevenDayRainfall.toFixed(1)} mm
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Field action
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {agriculture.agriculture.sevenDayRainfall >= 60
                          ? "Check drainage and protect fields from waterlogging."
                          : agriculture.agriculture.averageTemperature >= 35
                            ? "Plan irrigation and monitor heat stress."
                            : "Monitor crop condition and follow local agronomy guidance."}
                      </p>
                    </div>

                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">

                    <div className="rounded-2xl bg-slate-900 p-5 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        IndiaTwin crop signal
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {agriculture.agriculture.recommendation}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Important note
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        This is a weather-based planning signal, not a field-level crop diagnosis. Farmers should consider soil, crop variety, local advisories and actual field conditions before making decisions.
                      </p>
                    </div>

                  </div>
                </>
              )}

            </section>

            {/* PANCHAYAT DASHBOARD */}

            <section id="panchayat" className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Panchayat Dashboard
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    Community operations view
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    A planning workspace for local infrastructure, water assets, roads and community services. The current prototype combines available IndiaTwin signals with clearly labelled operational placeholders.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  Panchayat view
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Water assets</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">Monitoring ready</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Connect tank, borewell or reservoir readings here when an official sensor/data source is available.</p>
                  <span className="mt-4 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Data source needed</span>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Road condition</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">Community reporting</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Record road damage, blocked routes or maintenance needs for a future local issue workflow.</p>
                  <button type="button" onClick={() => window.alert("Road issue reporting can be connected to a Panchayat issue database in the next AWS integration step.")} className="mt-4 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Report issue</button>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Health centre</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">Service planning</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Use verified facility and service data to surface gaps such as availability, distance or operating status.</p>
                  <span className="mt-4 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Needs verified data</span>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Community risk</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{alerts ? alerts.summary.overallRisk : "Loading"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Current environmental signal for {selectedLocation.name}; use it as planning context rather than an official emergency warning.</p>
                  <a href="#alerts" className="mt-4 inline-flex rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">View risk signals</a>
                </div>

              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl bg-slate-900 p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Suggested local action</p>
                  <h3 className="mt-2 text-lg font-semibold">Prioritize water and drainage checks</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {weather && (weather.current.precipitation ?? 0) > 0
                      ? "Recent precipitation is present. Review drainage points and water assets before the next heavy-rain period."
                      : "Use the rainfall forecast and local observations to schedule water-asset and drainage checks."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Data boundary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Panchayat asset cards are a product workflow layer. They do not claim that IndiaTwin currently receives live tank, road or health-centre sensor data. Those connectors can be added through AWS in the next stage.
                  </p>
                </div>
              </div>

            </section>

            {/* AI FOOTER */}

            <section className="mt-6 overflow-hidden rounded-3xl bg-slate-900 p-7 text-white sm:p-9">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                AI Intelligence
              </p>

              <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
                Turning local data into practical decisions.
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                IndiaTwin combines geographic, weather, agriculture, water and infrastructure signals to create useful insights for Indian communities.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">

                  <p className="text-sm font-medium">
                    Data layer
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Location and weather signals.
                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">

                  <p className="text-sm font-medium">
                    Intelligence layer
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Risk and planning analysis.
                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">

                  <p className="text-sm font-medium">
                    Decision layer
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Actionable community insights.
                  </p>

                </div>

              </div>

            </section>

            {/* MOBILE NAV */}

            <div className="mt-8 grid grid-cols-5 gap-2 lg:hidden">

              <MobileNav
                icon="⌂"
                label="Overview"
              />

              <MobileNav
                icon="≈"
                label="Water"
              />

              <MobileNav
                icon="⌁"
                label="Agri"
              />

              <MobileNav
                icon="!"
                label="Alerts"
              />

              <MobileNav
                icon="🏘️"
                label="Panchayat"
              />

              <MobileNav
                icon="🎙️"
                label="Voice"
              />

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

/* COMPONENTS */

function NavItem({
  icon,
  label,
  active = false,
  href = "#overview",
}: {
  icon: string;
  label: string;
  active?: boolean;
  href?: string;
}) {
  return (
    <a
      href={href}
      className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "bg-slate-900 font-medium text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className="w-5 text-center">
        {icon}
      </span>

      {label}
    </a>
  );
}

function MobileNav({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 text-xs text-slate-500">
      <span className="mb-1 text-base">
        {icon}
      </span>

      {label}
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex items-start justify-between">

        <p className="text-sm text-slate-500">
          {label}
        </p>

        <span className="text-lg text-slate-400">
          {icon}
        </span>

      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {note}
      </p>

    </div>
  );
}

function WaterMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {note}
      </p>

    </div>
  );
}

function AgricultureMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {note}
      </p>

    </div>
  );
}

function WeatherDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>

    </div>
  );
}

function ForecastCard({
  date,
  high,
  low,
  rain,
  chance,
}: {
  date: string;
  high: number;
  low: number;
  rain: number;
  chance: number;
}) {
  const formattedDate =
    new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }
    );

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

      <p className="text-xs font-semibold text-slate-500">
        {formattedDate}
      </p>

      <p className="mt-4 text-2xl font-semibold">
        {Math.round(high)}°
      </p>

      <p className="text-xs text-slate-400">
        Low {Math.round(low)}°
      </p>

      <div className="mt-5 space-y-2 text-xs">

        <div className="flex justify-between">

          <span className="text-slate-400">
            Rain
          </span>

          <span className="font-medium">
            {rain} mm
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-slate-400">
            Chance
          </span>

          <span className="font-medium">
            {chance}%
          </span>

        </div>

      </div>

    </div>
  );
}

function IntelligenceCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <span className="text-lg text-slate-500">
        {icon}
      </span>

      <h3 className="mt-4 font-semibold">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        {text}
      </p>

    </div>
  );
}

function RiskCard({
  title,
  risk,
  icon,
}: {
  title: string;
  risk: string;
  icon: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${riskClass(
        risk
      )}`}
    >

      <div className="flex items-center justify-between">

        <span className="text-lg">
          {icon}
        </span>

        <span
          className={`h-3 w-3 rounded-full ${riskDot(
            risk
          )}`}
        />

      </div>

      <p className="mt-5 text-xs font-medium opacity-70">
        {title} risk
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {risk}
      </p>

    </div>
  );
}

function SignalMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold">
        {value}
      </p>

    </div>
  );
}

function AIStatusCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold">
        {value}
      </p>

    </div>
  );
}

function DataUsed({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>

    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="mt-7 rounded-2xl bg-slate-50 p-6 text-sm text-slate-400">
      Loading intelligence...
    </div>
  );
}

function IndiaTwinAuthGate() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("indiatwin-profile");
      if (saved) setProfile(JSON.parse(saved));
    } catch {
      window.localStorage.removeItem("indiatwin-profile");
    }
  }, []);

  function getAccount() {
    try {
      const saved = window.localStorage.getItem("indiatwin-account");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  function showError(text: string) {
    setMessageType("error");
    setMessage(text);
  }

  function showSuccess(text: string) {
    setMessageType("success");
    setMessage(text);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password.trim()) {
      showError("Please enter your email/phone and password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        showError("Password must be at least 6 characters.");
        return;
      }

      const existingAccount = getAccount();
      if (existingAccount && existingAccount.email?.toLowerCase() === cleanEmail.toLowerCase()) {
        showError("An account already exists with this email/phone. Please login.");
        setMode("login");
        return;
      }

      const savedName = name.trim() || cleanEmail.split("@")[0] || "IndiaTwin User";
      const account = { name: savedName, email: cleanEmail, password };
      const nextProfile = { name: savedName, email: cleanEmail };

      window.localStorage.setItem("indiatwin-account", JSON.stringify(account));
      window.localStorage.setItem("indiatwin-profile", JSON.stringify(nextProfile));
      setProfile(nextProfile);
      setPassword("");
      setConfirmPassword("");
      showSuccess("Account created successfully.");
      return;
    }

    if (mode === "forgot") {
      const account = getAccount();

      if (!account || account.email?.toLowerCase() !== cleanEmail.toLowerCase()) {
        showError("No account found with that email/phone.");
        return;
      }

      if (password.length < 6) {
        showError("New password must be at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
      }

      const updatedAccount = { ...account, password };
      window.localStorage.setItem("indiatwin-account", JSON.stringify(updatedAccount));
      setPassword("");
      setConfirmPassword("");
      setMode("login");
      showSuccess("Password reset successfully. You can login now.");
      return;
    }

    const account = getAccount();

    if (!account) {
      showError("No account found. Please create an account first.");
      return;
    }

    if (account.email?.toLowerCase() !== cleanEmail.toLowerCase()) {
      showError("Email/phone is incorrect.");
      return;
    }

    if (account.password !== password) {
      showError("Wrong password. Please try again or use Forgot password.");
      return;
    }

    const nextProfile = { name: account.name, email: account.email };
    window.localStorage.setItem("indiatwin-profile", JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setPassword("");
    setMessage("");
  }

  function handleLogout() {
    window.localStorage.removeItem("indiatwin-profile");
    setProfile(null);
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setMode("login");
  }

  function switchMode(nextMode: "login" | "signup" | "forgot") {
    setMode(nextMode);
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }

  if (profile) {
    return <DashboardContent profile={profile} onLogout={handleLogout} />;
  }

  const isForgot = mode === "forgot";
  const isSignup = mode === "signup";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight">IndiaTwin</div>
              <p className="mt-1 text-sm text-slate-400">AI-Powered Digital Twin for India</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Welcome to your workspace</p>
              <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight">
                Explore India through data, maps and AI intelligence.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-6 text-slate-400">
                Sign in to access your Digital Twin dashboard, location intelligence, weather, water, agriculture, alerts and AI insights.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
              <div className="rounded-2xl border border-white/10 p-4">Map Intelligence</div>
              <div className="rounded-2xl border border-white/10 p-4">AI Insights</div>
              <div className="rounded-2xl border border-white/10 p-4">Local Data</div>
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="lg:hidden">
                <div className="text-2xl font-bold tracking-tight">IndiaTwin</div>
                <p className="mt-1 text-sm text-slate-500">AI-Powered Digital Twin for India</p>
              </div>

              <div className="mt-8 lg:mt-0">
                {!isForgot && (
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    <button type="button" onClick={() => switchMode("login")} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Login</button>
                    <button type="button" onClick={() => switchMode("signup")} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Create account</button>
                  </div>
                )}

                <h2 className="mt-8 text-3xl font-semibold tracking-tight">
                  {isForgot ? "Reset your password" : isSignup ? "Create your profile" : "Welcome back"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isForgot
                    ? "Enter your registered email/phone and choose a new password."
                    : isSignup
                      ? "Create an account to personalize your IndiaTwin workspace."
                      : "Sign in to open your IndiaTwin workspace."}
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                  {isSignup && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Email or phone</span>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">{isForgot ? "New password" : "Password"}</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
                  </label>

                  {isForgot && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</span>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
                    </label>
                  )}

                  {message && (
                    <div className={`rounded-xl border px-4 py-3 text-sm ${messageType === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                      {message}
                    </div>
                  )}

                  <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                    {isForgot ? "Reset password" : isSignup ? "Create account & continue" : "Login to IndiaTwin"}
                  </button>
                </form>

                <div className="mt-5 flex items-center justify-between text-sm">
                  {mode === "login" ? (
                    <button type="button" onClick={() => switchMode("forgot")} className="font-semibold text-slate-700 hover:text-slate-950">
                      Forgot password?
                    </button>
                  ) : (
                    <button type="button" onClick={() => switchMode("login")} className="font-semibold text-slate-700 hover:text-slate-950">
                      ← Back to login
                    </button>
                  )}
                  {mode === "login" && (
                    <button type="button" onClick={() => switchMode("signup")} className="text-slate-500 hover:text-slate-900">
                      Create account
                    </button>
                  )}
                </div>

                <p className="mt-6 text-center text-xs leading-5 text-slate-400">
                  Prototype authentication uses browser storage. For a real deployment, use AWS Cognito or another secure authentication service instead of storing passwords in localStorage.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return <IndiaTwinAuthGate />;
}
