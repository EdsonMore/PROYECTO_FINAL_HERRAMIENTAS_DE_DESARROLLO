"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix para los iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

// Crear icono personalizado para el marcador de ubicación actual
const createCustomMarkerIcon = (color: string = "blue") => {
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg" style="background-color: ${color};">
        <div class="w-3 h-3 bg-white rounded-full"></div>
      </div>
    `,
    iconSize: [32, 32],
    className: "custom-marker",
  })
}

interface MapComponentProps {
  center: [number, number]
  zoom?: number
  markers?: Array<{ lat: number; lng: number; popup?: string }>
  onLocationSelect?: (lat: number, lng: number) => void
  className?: string
}

export function MapComponent({ 
  center, 
  zoom = 13, 
  markers = [], 
  onLocationSelect, 
  className = "" 
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const clickHandlerRef = useRef(onLocationSelect)
  const isUnmountingRef = useRef(false)

  // Actualizar referencia del handler sin recrear el mapa
  useEffect(() => {
    clickHandlerRef.current = onLocationSelect
  }, [onLocationSelect])

  // Inicializar el mapa UNA SOLA VEZ
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapRef.current) return // Ya existe, no recrear

    isUnmountingRef.current = false

    try {
      // Asegurar que el contenedor tenga dimensiones
      if (mapContainerRef.current.offsetWidth === 0 || mapContainerRef.current.offsetHeight === 0) {
        console.warn("Contenedor del mapa sin dimensiones")
        return
      }

      // Inicializar el mapa
      const map = L.map(mapContainerRef.current, {
        preferCanvas: true,
        zoomControl: true,
        fadeAnimation: false,
        zoomAnimation: false,
      }).setView(center, zoom)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Capa para los marcadores
      const markersLayer = L.layerGroup().addTo(map)
      markersLayerRef.current = markersLayer

      // Click en el mapa para seleccionar ubicación
      map.on("click", (e: L.LeafletMouseEvent) => {
        if (!isUnmountingRef.current && clickHandlerRef.current && e.latlng) {
          clickHandlerRef.current(e.latlng.lat, e.latlng.lng)
        }
      })

      // Forzar actualización de tamaño
      setTimeout(() => {
        if (mapRef.current && !isUnmountingRef.current) {
          try {
            mapRef.current.invalidateSize()
          } catch (e) {
            console.error("Error invalidando tamaño:", e)
          }
        }
      }, 100)

      mapRef.current = map
    } catch (error) {
      console.error("Error inicializando mapa:", error)
    }

    return () => {
      isUnmountingRef.current = true
      
      if (mapRef.current) {
        try {
          // Pausar animaciones
          mapRef.current.off()
          
          // Remover capa de marcadores
          if (markersLayerRef.current) {
            try {
              markersLayerRef.current.clearLayers()
              mapRef.current.removeLayer(markersLayerRef.current)
            } catch (e) {
              console.error("Error limpiando marcadores:", e)
            }
          }
          
          // Remover el mapa de forma segura
          mapRef.current.remove()
        } catch (e) {
          console.error("Error removiendo mapa:", e)
        }
        mapRef.current = null
        markersLayerRef.current = null
      }
    }
  }, []) // Dependencias vacías = solo se ejecuta al montar

  // Actualizar centro y zoom cuando cambien
  useEffect(() => {
    if (mapRef.current && !isUnmountingRef.current) {
      try {
        mapRef.current.setView(center, zoom)
      } catch (e) {
        console.error("Error actualizando vista:", e)
      }
    }
  }, [center, zoom])

  // Actualizar marcadores cuando cambien
  useEffect(() => {
    if (!markersLayerRef.current || !mapRef.current || isUnmountingRef.current) return

    try {
      markersLayerRef.current.clearLayers()

      markers.forEach((marker, index) => {
        try {
          const isFirstMarker = index === 0
          const leafletMarker = L.marker([marker.lat, marker.lng], {
            icon: createCustomMarkerIcon(isFirstMarker ? "#22c55e" : "#3b82f6"),
          })
          if (marker.popup) {
            leafletMarker.bindPopup(marker.popup).openPopup()
          }
          leafletMarker.addTo(markersLayerRef.current!)
        } catch (error) {
          console.error(`Error agregando marcador ${index}:`, error)
        }
      })

      // Ajustar vista si hay marcadores
      if (markers.length > 0 && mapRef.current && !isUnmountingRef.current) {
        try {
          const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]))
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
        } catch (error) {
          console.error("Error ajustando bounds:", error)
        }
      }
    } catch (error) {
      console.error("Error actualizando marcadores:", error)
    }
  }, [markers])

  return <div ref={mapContainerRef} className={`h-[400px] w-full rounded-lg border-2 border-primary/20 ${className}`} />
}
