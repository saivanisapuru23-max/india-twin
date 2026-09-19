"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lon], 13, { animate: true });
  }, [lat, lon, map]);

  return null;
}

export default function DigitalTwinMap({
  lat,
  lon,
  name,
}: {
  lat: number;
  lon: number;
  name: string;
}) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={13}
      scrollWheelZoom={true}
      className="h-full min-h-[450px] w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={lat} lon={lon} />
      <Marker position={[lat, lon]} icon={markerIcon}>
        <Popup>
          <strong>{name}</strong>
          <br />
          IndiaTwin selected location
        </Popup>
      </Marker>
    </MapContainer>
  );
}
