import { getHealthColor } from "@/lib/health-utils";
import L from "leaflet";

export const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  let size = "35";
  let bgColor = "#3b82f6"; // blue por defecto

  if (count > 100) {
    size = "50";
    bgColor = "#dc2626"; // red para muchos
  } else if (count > 50) {
    size = "45";
    bgColor = "#f97316"; // orange
  } else if (count > 10) {
    size = "40";
    bgColor = "#10b981"; // green
  }

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bgColor};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${count}
      </div>
    `,
    iconSize: [parseInt(size), parseInt(size)],
    className: "cluster-icon",
  });
};

export const createCustomMarkerIcon = (color: string = "blue") => {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        position: relative;
      ">
        <div style="
          background: white;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          opacity: 0.5;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: "tree-marker",
  });
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getMarkerColor = (
  healthStatus?: string,
  isUserLocation: boolean = false
): string => {
  if (isUserLocation) return "#1e40af"; // Azul oscuro para tu ubicación
  if (!healthStatus) return "#6b7280"; // Gris por defecto
  return getHealthColor(healthStatus);
};
