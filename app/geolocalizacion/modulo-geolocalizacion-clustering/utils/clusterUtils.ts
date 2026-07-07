import { getHealthColor } from "@/lib/health-utils";
import L from "leaflet";

export const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  let size = 38;

  // Contar por grupos de color (verde, amarillo, rojo)
  let green = 0,
    yellow = 0,
    red = 0;

  try {
    const childMarkers: any[] = cluster.getAllChildMarkers ? cluster.getAllChildMarkers() : [];
    childMarkers.forEach((m) => {
      const hs = m.options?.healthStatus;
      const idx = m.options?.indice_supervivencia;
      if (hs === "excelente") green++;
      else if (hs === "regular") yellow++;
      else if (hs === "malo") red++;
      else if (typeof idx === "number") {
        if (idx >= 80) green++;
        else if (idx >= 60) yellow++;
        else red++;
      }
    });
  } catch (e) {
    // ignore
  }

  // Color primario por mayoría
  // Usar colores canónicos desde health-utils
  let primaryColor = "#6b7280"; // gris
  if (green >= yellow && green >= red) primaryColor = getHealthColor("excelente");
  else if (yellow >= green && yellow >= red) primaryColor = getHealthColor("regular");
  else if (red >= green && red >= yellow) primaryColor = getHealthColor("malo");

  if (count > 150) size = 56;
  else if (count > 80) size = 48;
  else if (count > 30) size = 44;

  const html = `
    <div style="width:${size}px;height:${size}px;background:${primaryColor};border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;box-shadow:0 2px 4px rgba(0,0,0,0.25)">
      <div style="font-size:16px;line-height:1">${count}</div>
    </div>
  `;

  return L.divIcon({
    html,
    iconSize: [size, size],
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
          background: rgba(255,255,255,0.9);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: inset 0 1px 0 rgba(0,0,0,0.05);
        "></div>
        <div style="
          position: absolute;
          right: -2px;
          top: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.85);
          display:flex;align-items:center;justify-content:center;
          font-size:8px;color:#111;border:1px solid rgba(0,0,0,0.06)
        ">✓</div>
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
  indice_supervivencia?: number | null,
  isUserLocation: boolean = false
): string => {
  if (isUserLocation) return "#1e40af"; // Azul oscuro para tu ubicación
  // Priorizar el estado de salud textual si está disponible
  if (healthStatus) {
    return getHealthColor(healthStatus)
  }

  // Si no hay estado textual, usar índice de supervivencia
  if (typeof indice_supervivencia === "number") {
    if (indice_supervivencia >= 80) return "#16a34a"; // verde
    if (indice_supervivencia >= 60) return "#f59e0b"; // amarillo
    if (indice_supervivencia >= 40) return "#f97316"; // naranja
    return "#ef4444"; // rojo
  }

  return "#6b7280"; // Gris por defecto
};
