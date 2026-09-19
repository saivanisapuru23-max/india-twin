# IndiaTwin — AI-Powered Digital Twin for India

IndiaTwin is a digital twin platform built for Indian villages, towns, and local areas. It brings location, weather, water, agriculture, and risk information together in one dashboard.

Users can search for a location in India and view its map, weather, water situation, agriculture conditions, risk indicators, AI insights, government schemes, and local development information.

## What is IndiaTwin?

IndiaTwin combines different data signals for a selected Indian location and presents them in one place.

A user can explore:

* 📍 Interactive map
* 🌦️ Weather intelligence
* 💧 Water intelligence
* 🌾 Agriculture intelligence
* 👨‍🌾 Farmer Mode
* ⚠️ Flood, drought, and heat-risk indicators
* 🤖 AI Insights
* 🏛️ Government scheme information
* 🏘️ Panchayat Dashboard
* 🎙️ Local-language Voice Assistant

## Problem

Information about a village or local area is usually available in different places.

For example, weather, rainfall, agriculture, water, and local development information may need to be checked separately. IndiaTwin brings these signals together so they can be viewed from one location-based dashboard.

## Solution

The user selects an Indian location and IndiaTwin builds its dashboard around that location.

The basic flow is:

1. Search for a location in India.
2. Select the required place.
3. View the place on the map.
4. Get weather and forecast information.
5. Generate water and agriculture indicators.
6. Check flood, drought, and heat-risk signals.
7. Get AI-generated insights and suggested actions.
8. Use Farmer Mode, Government Schemes, Panchayat Dashboard, or Voice Assistant.

## Key Features

### India-Only Location Search

Search for villages, towns, cities, and other local areas across India.

### Interactive Map

The selected location is displayed using an OpenStreetMap-based map.

### Weather Intelligence

Shows current weather conditions and a 7-day forecast for the selected location.

### Water Intelligence

Uses rainfall and forecast information to provide short-term water-risk information.

### Agriculture Intelligence

Uses weather and rainfall signals to provide a short-term agriculture condition.

### Farmer Mode

Farmer Mode provides simple planning information such as:

* Crop outlook
* Irrigation guidance
* Field actions
* Weather-based suggestions

The information is based on available weather and forecast data and is not a field-level agricultural diagnosis.

### Risk Alerts

IndiaTwin provides indicators for:

* Flood risk
* Drought risk
* Heat risk

These are forecast-based planning indicators and are not official emergency warnings.

### AI Insights

AI Insights combines the available location, weather, water, agriculture, and risk information.

It provides:

* Overall risk
* Practical insights
* Suggested actions
* Location-specific information

The application can use Amazon Bedrock when AWS access is configured and can fall back to the local intelligence layer when Bedrock is unavailable.

### Government Schemes

The dashboard includes information and links for relevant Indian government schemes and services.

### Panchayat Dashboard

The Panchayat Dashboard provides a planning view for:

* Water assets
* Road-condition reporting
* Health-centre service planning
* Community risk
* Suggested local actions

The dashboard does not present these as live government or sensor readings unless such data is actually connected.

### Local-Language Voice Assistant

The browser-based Voice Assistant supports:

* English
* Telugu
* Hindi
* Tamil
* Marathi
* Bengali

It uses browser speech recognition and speech synthesis where supported.

## AI Approach

IndiaTwin uses AI after collecting the available location and environmental signals.

```text
Location Data
      ↓
Weather Data
      ↓
Water Signals
      ↓
Agriculture Signals
      ↓
Risk Signals
      ↓
AI Analysis
      ↓
Insights + Suggested Actions
```

The AI layer is used to interpret the available information instead of treating every value as a live sensor reading.

## Architecture

```text
                         ┌─────────────────────┐
                         │       User          │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ IndiaTwin Dashboard │
                         └──────────┬──────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        Location Search       Interactive Map      Voice Assistant
                │                   │                   │
                ▼                   ▼                   ▼
             Nominatim          Leaflet/OSM       Browser Speech
                │
                ▼
       ┌──────────────────────────────┐
       │      Intelligence APIs       │
       ├──────────────────────────────┤
       │ Weather                      │
       │ Water                        │
       │ Agriculture                  │
       │ Alerts                       │
       │ Scenarios                    │
       └──────────────┬───────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  AI Insights  │
              └───────┬───────┘
                      │
             ┌────────┴────────┐
             ▼                 ▼
      Amazon Bedrock      Local AI Fallback
```

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* React Leaflet
* OpenStreetMap
* Nominatim
* Open-Meteo
* AWS SDK for JavaScript
* Amazon Bedrock integration

## Main API Routes

| Route              | Purpose                             |
| ------------------ | ----------------------------------- |
| `/api/location`    | India-only location search          |
| `/api/weather`     | Weather and forecast data           |
| `/api/water`       | Water-risk information              |
| `/api/agriculture` | Agriculture information             |
| `/api/alerts`      | Flood, drought, and heat indicators |
| `/api/scenario`    | Environmental scenario analysis     |
| `/api/ai-insights` | AI intelligence layer               |

## Getting Started

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production Build

Run the production build:

```powershell
npm run build
```

Start the production server:

```powershell
npm start
```

## AWS / Amazon Bedrock

IndiaTwin can use AWS as the cloud and AI layer.

Amazon Bedrock can be used to generate the AI insights using an Amazon Nova model when the AWS environment is configured.

AWS credentials are kept on the server side and are not exposed to the browser.

AWS credentials should not be committed to GitHub.

### Do not commit

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
```

## Data Boundaries

IndiaTwin is a hackathon prototype and decision-support application.

It does not currently claim to provide:

* Official emergency warnings
* Guaranteed crop yields
* Medical diagnoses
* Field-level crop disease diagnoses
* Government-scheme eligibility decisions
* Live sensor readings where no sensor integration exists

Forecast-based information should be checked against authoritative local sources before making important decisions.

## Demo Flow

A short demo can show:

1. Open IndiaTwin.
2. Search for an Indian village or locality.
3. Open the dashboard.
4. Show the location on the map.
5. Show Weather Intelligence.
6. Show Water Intelligence.
7. Show Agriculture Intelligence.
8. Open Farmer Mode.
9. Show Risk Alerts.
10. Open AI Insights.
11. Show Government Schemes.
12. Show Panchayat Dashboard.
13. Demonstrate the Voice Assistant in a local language.

## Future Expansion

Possible future additions include:

* AWS Lambda
* Amazon DynamoDB
* Amazon S3
* AWS Amplify
* Satellite imagery
* Government/open-data integrations
* Water-level sensors
* Agricultural market-price data
* More Indian languages
* WhatsApp-style voice interaction
* Additional official datasets

## Hackathon

IndiaTwin is being built for the Bharat Builds / First Commit hackathon.

The project focuses on using AI and data-driven information to help Indian communities understand local conditions and plan around weather, water, agriculture, and development needs.

## Team

**CodePulse**

## Project Status

IndiaTwin currently has a working dashboard with:

* Location search
* Interactive map
* Weather
* Water intelligence
* Agriculture intelligence
* Risk indicators
* Farmer Mode
* Government Schemes
* Panchayat Dashboard
* Voice Assistant
* AI Insights

The next step is deployment and final hackathon submission.

## License

This project is currently a hackathon prototype.
