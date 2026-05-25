"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ClusterMarker, ClusteringConfig } from "../types";
import { createClusterIcon, createCustomMarkerIcon, getMarkerColor } from "../utils/clusterUtils";

let MarkerClusterGroupLoaded = false;

// Fix para los iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapClusteringComponentProps {
  center: [number, number];
  zoom?: number;
  markers?: ClusterMarker[];
  onLocationSelect?: (lat: number, lng: number) => void;
  clusteringConfig?: ClusteringConfig;
  className?: string;
}

export function MapClusteringComponent({
  center,
  zoom = 13,
  markers = [],
  onLocationSelect,
  clusteringConfig = {},
  className = "",
}: MapClusteringComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerClusterGroupRef = useRef<any | null>(null);
  const clickHandlerRef = useRef(onLocationSelect);
  const isUnmountingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Cargar MarkerClusterGroup dinámicamente
  useEffect(() => {
    const loadClusterGroup = async () => {
      try {
        await import("leaflet.markercluster");
        await import("leaflet.markercluster/dist/MarkerCluster.css");
        await import("leaflet.markercluster/dist/MarkerCluster.Default.css");
        MarkerClusterGroupLoaded = true;
        setIsReady(true);
        console.log("Leaflet MarkerClusterGroup cargado exitosamente");
      } catch (error) {
        console.error("Error cargando MarkerClusterGroup:", error);
      }
    };
    loadClusterGroup();
  }, []);

  // Actualizar referencia del handler sin recrear el mapa
  useEffect(() => {
    clickHandlerRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Inicializar el mapa UNA SOLA VEZ
  useEffect(() => {
    console.log("Map init effect - isReady:", isReady, "mapRef exists:", !!mapRef.current);

    if (!mapContainerRef.current || !isReady) return;
    if (mapRef.current) return;

    isUnmountingRef.current = false;

    try {
      if (mapContainerRef.current.offsetWidth === 0 || mapContainerRef.current.offsetHeight === 0) {
        console.warn("Contenedor del mapa sin dimensiones");
        return;
      }

      // Inicializar el mapa
      const map = L.map(mapContainerRef.current, {
        preferCanvas: true,
        zoomControl: true,
        fadeAnimation: false,
        zoomAnimation: false,
      }).setView(center, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Crear grupo de clustering
      const markerClusterGroup = new (L as any).MarkerClusterGroup({
        maxClusterRadius: clusteringConfig.maxClusterRadius ?? 80,
        showCoverageOnHover: clusteringConfig.showCoverageOnHover ?? true,
        zoomToBoundsOnClick: clusteringConfig.zoomToBoundsOnClick ?? true,
        disableClusteringAtZoom: clusteringConfig.disableClusteringAtZoom ?? 15,
        iconCreateFunction: createClusterIcon,
      });

      map.addLayer(markerClusterGroup);
      markerClusterGroupRef.current = markerClusterGroup;

      // Click en el mapa para seleccionar ubicación
      map.on("click", (e: L.LeafletMouseEvent) => {
        if (!isUnmountingRef.current && clickHandlerRef.current && e.latlng) {
          clickHandlerRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      // Forzar actualización de tamaño
      setTimeout(() => {
        if (mapRef.current && !isUnmountingRef.current) {
          try {
            mapRef.current.invalidateSize();
          } catch (e) {
            console.error("Error invalidando tamaño:", e);
          }
        }
      }, 100);

      mapRef.current = map;
    } catch (error) {
      console.error("Error inicializando mapa con clustering:", error);
    }

    return () => {
      isUnmountingRef.current = true;

      if (mapRef.current) {
        try {
          mapRef.current.off();

          if (markerClusterGroupRef.current) {
            try {
              markerClusterGroupRef.current.clearLayers();
              mapRef.current.removeLayer(markerClusterGroupRef.current);
            } catch (e) {
              console.error("Error limpiando clustering:", e);
            }
          }

          mapRef.current.remove();
        } catch (e) {
          console.error("Error removiendo mapa:", e);
        }
        mapRef.current = null;
        markerClusterGroupRef.current = null;
      }
    };
  }, [isReady]);

  // Actualizar centro y zoom cuando cambien
  useEffect(() => {
    if (mapRef.current && !isUnmountingRef.current) {
      try {
        mapRef.current.setView(center, zoom);
      } catch (e) {
        console.error("Error actualizando vista:", e);
      }
    }
  }, [center, zoom]);

  // Actualizar marcadores cuando cambien
  useEffect(() => {
    console.log("Markers effect running - isReady:", isReady, "markers count:", markers.length, "hasClusterGroup:", !!markerClusterGroupRef.current, "hasMap:", !!mapRef.current);

    if (!isReady || !markerClusterGroupRef.current || !mapRef.current || isUnmountingRef.current) return;

    try {
      markerClusterGroupRef.current.clearLayers();

      markers.forEach((marker, index) => {
        try {
          const isFirstMarker = index === 0;
          const markerColor = getMarkerColor(marker.healthStatus, isFirstMarker && !marker.healthStatus);
          const leafletMarker = L.marker([marker.lat, marker.lng], {
            icon: createCustomMarkerIcon(markerColor),
          });

          if (marker.popup) {
            leafletMarker.bindPopup(marker.popup);
          }

          markerClusterGroupRef.current!.addLayer(leafletMarker);
        } catch (error) {
          console.error(`Error agregando marcador ${index}:`, error);
        }
      });

      // Ajustar vista si hay marcadores
      if (markers.length > 0 && mapRef.current && !isUnmountingRef.current) {
        try {
          const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } catch (error) {
          console.error("Error ajustando bounds:", error);
        }
      }
    } catch (error) {
      console.error("Error actualizando marcadores con clustering:", error);
    }
  }, [markers, clusteringConfig, isReady]);

  return (
    <div
      ref={mapContainerRef}
      className={`h-[500px] w-full rounded-lg border-2 border-primary/20 ${className}`}
    />
  );
}
