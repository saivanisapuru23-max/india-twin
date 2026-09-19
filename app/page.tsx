"use client";

import { FormEvent, useState } from "react";

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

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchLocation(event: FormEvent) {
    event.preventDefault();

    const value = query.trim();

    if (!value) {
      setError("Enter a village, town, city or locality.");
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/location?q=${encodeURIComponent(value)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to search location."
        );
      }

      setResults(data.results || []);

      if (!data.results?.length) {
        setError(
          "No matching Indian location found. Try another name."
        );
      }
    } catch (err) {
      console.error(err);

      setResults([]);
      setError(
        "Unable to search right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function selectLocation(location: LocationResult) {
    const params = new URLSearchParams();

    params.set("name", location.name);
    params.set("displayName", location.displayName);
    params.set("lat", String(location.lat));
    params.set("lon", String(location.lon));
    params.set("district", location.district);
    params.set("state", location.state);

    window.location.href = `/dashboard?${params.toString()}`;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f8fc] text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">

          <div>

            <div className="text-2xl font-bold tracking-tight">
              India
              <span className="text-blue-600">
                Twin
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              AI-Powered Digital Twin for India
            </p>

          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-500 md:flex">

            <a
              href="#explore"
              className="transition hover:text-blue-600"
            >
              Explore
            </a>

            <a
              href="#intelligence"
              className="transition hover:text-blue-600"
            >
              Intelligence
            </a>

            <a
              href="#how-it-works"
              className="transition hover:text-blue-600"
            >
              How it works
            </a>

          </nav>

        </div>

      </header>

      {/* HERO */}

      <section className="relative">

        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.12),transparent_45%)]" />

        <div className="mx-auto max-w-7xl px-5 pb-16 pt-20 md:px-8 md:pb-24 md:pt-28">

          <div className="mx-auto max-w-4xl text-center">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600">

              <span className="h-2 w-2 rounded-full bg-blue-500" />

              DIGITAL TWIN PLATFORM FOR INDIA

            </div>

            <h1 className="text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">

              Understand India.

              <span className="block text-blue-600">
                One place at a time.
              </span>

            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-500 md:text-lg">

              IndiaTwin creates an AI-powered digital
              representation of Indian villages, towns
              and cities using geographic, weather,
              agriculture, water and infrastructure data.

            </p>

          </div>

          {/* SEARCH */}

          <div
            id="explore"
            className="mx-auto mt-12 max-w-3xl"
          >

            <form
              onSubmit={searchLocation}
              className="rounded-3xl border border-slate-200 bg-white p-2 shadow-xl shadow-blue-100/40"
            >

              <div className="flex flex-col gap-2 sm:flex-row">

                <div className="flex flex-1 items-center px-5">

                  <span className="mr-3 text-lg text-blue-500">
                    ⌕
                  </span>

                  <input
                    value={query}
                    onChange={(event) =>
                      setQuery(event.target.value)
                    }
                    placeholder="Search any village, town or city in India..."
                    className="w-full bg-transparent py-4 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-blue-600 px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Searching..."
                    : "Explore location"}
                </button>

              </div>

            </form>

            {error && (
              <p className="mt-4 text-center text-sm text-red-500">
                {error}
              </p>
            )}

            {/* SEARCH RESULTS */}

            {results.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xl">

                <div className="border-b border-slate-100 px-5 py-3">

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Indian locations found
                  </p>

                </div>

                <div className="max-h-[420px] overflow-y-auto">

                  {results.map((location) => (

                    <button
                      key={location.id}
                      onClick={() =>
                        selectLocation(location)
                      }
                      className="w-full border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-blue-50"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <p className="font-semibold text-slate-800">
                            {location.name}
                          </p>

                          <p className="mt-1 text-sm leading-5 text-slate-500">
                            {location.displayName}
                          </p>

                        </div>

                        <span className="mt-1 shrink-0 text-blue-500">
                          →
                        </span>

                      </div>

                    </button>

                  ))}

                </div>

              </div>
            )}

          </div>

          <div className="mt-7 text-center">

            <p className="text-xs text-slate-400">
              Search is restricted to locations within India.
            </p>

          </div>

        </div>

      </section>

      {/* INTELLIGENCE */}

      <section
        id="intelligence"
        className="border-y border-slate-200 bg-white"
      >

        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">

          <div className="max-w-2xl">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Intelligence layer
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              Data that helps communities make better decisions.
            </h2>

            <p className="mt-4 leading-7 text-slate-500">
              IndiaTwin brings multiple local signals
              together so a place can be understood
              as one connected system.
            </p>

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <FeatureCard
              number="01"
              title="Water"
              text="Monitor water availability and identify potential shortage risks."
            />

            <FeatureCard
              number="02"
              title="Agriculture"
              text="Understand crop conditions, suitability and seasonal opportunities."
            />

            <FeatureCard
              number="03"
              title="Weather"
              text="Track temperature, rainfall, wind and forecast conditions."
            />

            <FeatureCard
              number="04"
              title="Infrastructure"
              text="Identify development gaps across roads, health and essential services."
            />

          </div>

        </div>

      </section>

      {/* DIGITAL TWIN */}

      <section className="bg-[#eef5fb]">

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-2">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Digital Twin
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
              See your place as a living data system.
            </h2>

            <p className="mt-5 leading-7 text-slate-500">
              Select any location in India and IndiaTwin
              turns it into an interactive digital twin.
              Geographic data becomes the foundation for
              weather, water, agriculture and development
              intelligence.
            </p>

            <div className="mt-8 space-y-4">

              <StepLine
                number="01"
                text="Select an Indian location"
              />

              <StepLine
                number="02"
                text="Build its geographic twin"
              />

              <StepLine
                number="03"
                text="Combine real-world signals"
              />

              <StepLine
                number="04"
                text="Generate useful intelligence"
              />

            </div>

          </div>

          {/* VISUAL */}

          <div className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-blue-100/40">

            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 p-1">

              <div className="rounded-[1.35rem] bg-white p-6">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Digital Twin
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      Indian Community
                    </p>

                  </div>

                  <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600">
                    Location
                  </div>

                </div>

                <div className="mt-6 flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50">

                  <div className="relative">

                    <div className="h-40 w-40 rounded-full border-[16px] border-blue-200" />

                    <div className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-blue-600 shadow-xl shadow-blue-600/30" />

                    <div className="absolute -right-16 top-4 h-3 w-3 rounded-full bg-cyan-500" />

                    <div className="absolute -left-12 bottom-8 h-3 w-3 rounded-full bg-blue-400" />

                    <div className="absolute bottom-0 right-2 h-3 w-3 rounded-full bg-emerald-500" />

                  </div>

                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">

                  <MiniStat
                    label="Weather"
                    value="Ready"
                  />

                  <MiniStat
                    label="Water"
                    value="Analysis"
                  />

                  <MiniStat
                    label="AI"
                    value="Insights"
                  />

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* HOW IT WORKS */}

      <section
        id="how-it-works"
        className="bg-white"
      >

        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">

          <div className="text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-950 md:text-4xl">
              From location to intelligence.
            </h2>

          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">

            <ProcessCard
              number="01"
              title="Choose"
              text="Search and select any village, town or city in India."
            />

            <ProcessCard
              number="02"
              title="Understand"
              text="Explore its map, weather and local environmental signals."
            />

            <ProcessCard
              number="03"
              title="Act"
              text="Use AI-generated insights to understand risks and opportunities."
            />

          </div>

        </div>

      </section>

      {/* CTA */}

      <section className="bg-slate-950">

        <div className="mx-auto max-w-5xl px-5 py-20 text-center md:px-8">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            IndiaTwin
          </p>

          <h2 className="mt-4 text-3xl font-bold text-white md:text-5xl">
            Every place has a story.
            <span className="block text-blue-400">
              Let the data reveal it.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-400">
            Explore an Indian location and start
            building its digital twin.
          </p>

          <a
            href="#explore"
            className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-blue-50"
          >
            Explore India
          </a>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="border-t border-slate-800 bg-slate-950">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-8">

          <p>
            IndiaTwin — AI-Powered Digital Twin for India
          </p>

          <p>
            Built for Indian communities.
          </p>

        </div>

      </footer>

    </main>
  );
}

function FeatureCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">

      <span className="text-xs font-semibold text-blue-600">
        {number}
      </span>

      <h3 className="mt-5 text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {text}
      </p>

    </div>
  );
}

function StepLine({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4">

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
        {number}
      </span>

      <span className="text-sm font-medium text-slate-700">
        {text}
      </span>

    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <p className="text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-700">
        {value}
      </p>

    </div>
  );
}

function ProcessCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-600">
        {number}
      </div>

      <h3 className="mt-6 text-xl font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-slate-500">
        {text}
      </p>

    </div>
  );
}