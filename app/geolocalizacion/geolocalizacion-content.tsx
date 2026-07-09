"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Navigation,
  Loader2,
  TreePine,
  Compass,
  AlertCircle,
  CloudSun,
  Activity,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HealthFilter } from "@/components/health-filter";
import { getCoherentSurvivalScore, getHealthLabel } from "@/lib/health-utils";
import { MapClusteringComponent } from "./modulo-geolocalizacion-clustering";
import type { Arbol } from "@/types";

interface UserLocation {
  lat: number;
  lng: number;
}

interface WeatherInfo {
  temperatura?: number;
  humedad?: number;
  descripcion?: string;
  icono?: string;
  indice_supervivencia?: number;
  riesgo_ambiental?: string;
  recomendaciones?: string[];
}

interface TreeDistance extends Arbol {
  recomendaciones?: string[];
  indice_supervivencia?: number | null;
  distance?: number | null;
  weather?: WeatherInfo;
}

const DEFAULT_PIURA_LOCATION: UserLocation = {
  lat: -5.1946,
  lng: -80.6307,
};

export function GeolocalizacionContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [userWeather, setUserWeather] = useState<any>(null);
  const [arboles, setArboles] = useState<Arbol[]>([]);
  const [treeDistances, setTreeDistances] = useState<TreeDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeHealthFilters, setActiveHealthFilters] = useState<string[]>(["EXCELENTE", "BUENO", "REGULAR", "MALO", "CRITICO"]);
  const [activeTreeFilters, setActiveTreeFilters] = useState<string[]>(["EXCELENTE", "BUENO", "REGULAR", "MALO", "CRITICO"]);

  useEffect(() => {
    // En desarrollo permitimos ver la página sin autenticación para facilitar pruebas.
    if (status === "unauthenticated" && process.env.NODE_ENV === "production") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // En desarrollo permitir carga como "guest" para pruebas locales
    if (status === "authenticated" || process.env.NODE_ENV !== "production") {
      fetchArboles();
      getGeolocation();
    }
  }, [status]);

  const getGeolocation = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      setGeoLoading(false);
      return;
    }

    setGeoLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Obtener clima del usuario
        try {
          const weatherRes = await fetch(
            `/geolocalizacion/api-clima?lat=${latitude}&lon=${longitude}`
          );
            if (weatherRes.ok) {
              const weatherData = await weatherRes.json();
              const indice = weatherData.indices?.indice_supervivencia ?? 75;
              const recomendaciones = weatherData.recomendaciones_arbol ?? generateLocalRecommendations(undefined, undefined, indice);
              const zoneRecs = generateZoneRecommendations(latitude, longitude, weatherData.indices?.riesgo_ambiental ?? null, indice, undefined)
              const finalRecs = Array.isArray(recomendaciones) ? [...recomendaciones, ...zoneRecs] : [...zoneRecs]
              setUserWeather({
                ...weatherData,
                recomendaciones: finalRecs,
              });
            }
        } catch (error) {
          console.error("Error fetching user weather:", error);
        }
        
        setGeoLoading(false);

        // Calcular distancias
        if (arboles.length > 0) {
          calculateDistances({ lat: latitude, lng: longitude });
        }
      },
      (error) => {
        let errorMsg = "No pudimos detectar tu ubicación.";
        if (error.code === 1) {
          errorMsg = "Permisos de ubicación denegados. Habilita en la configuración del navegador.";
        } else if (error.code === 2) {
          errorMsg = "No se pudo obtener la ubicación. Verifica que el GPS esté activado.";
        } else if (error.code === 3) {
          errorMsg = "La solicitud tardó demasiado. Intenta nuevamente.";
        }
        setError(errorMsg);
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const fetchArboles = async () => {
    try {
      const res = await fetch("/api/arboles?mode=geo", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setArboles(data);

        // Si no tenemos userLocation aún, igualmente intentamos obtener clima
        // para cada árbol y poblar treeDistances para que se vean en el mapa.
        if (!userLocation) {
          try {
            const treesWithWeather = await Promise.all(
              data.map(async (tree: any) => {
                try {
                  const weatherRes = await fetch(
                    `/geolocalizacion/api-clima?lat=${tree.latitud}&lon=${tree.longitud}&species=${encodeURIComponent(tree.especie || "")}`
                  );
                  if (weatherRes.ok) {
                    const weatherData = await weatherRes.json();
                    const indice = weatherData.indices?.indice_supervivencia ?? 75;
                    const recomendaciones = weatherData.recomendaciones_arbol ?? generateLocalRecommendations(tree.especie, tree.estado_salud, indice);
                    return {
                      ...tree,
                      distance: null,
                      weather: {
                        temperatura: weatherData.current?.temperatura,
                        humedad: weatherData.current?.humedad,
                        descripcion: weatherData.current?.descripcion,
                        icono: weatherData.current?.icono,
                        indice_supervivencia: indice,
                        riesgo_ambiental: weatherData.indices?.riesgo_ambiental ?? 'desconocido',
                        recomendaciones,
                      },
                    };
                  }
                } catch (err) {
                  console.error("Error fetching weather for tree (no location):", err);
                }
                return { ...tree, distance: null, weather: { indice_supervivencia: 75, recomendaciones: [] } };
              })
            );
            setTreeDistances(normalizeTrees(treesWithWeather));
          } catch (err) {
            console.error("Error poblando árboles sin ubicación:", err);
            setTreeDistances(normalizeTrees(data.map((t: any) => ({ ...t, distance: null, weather: { indice_supervivencia: 75, recomendaciones: [] } }))));
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar árboles:", error);
      setError("Error al cargar los árboles");
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  const generateLocalRecommendations = (especie?: string, estado?: string, indice?: number) => {
    const recs: string[] = [];
    if (indice != null) {
      if (indice < 40) {
        recs.push('🚨 Supervivencia baja: intervención urgente (riego, revisión)');
      } else if (indice < 60) {
        recs.push('⚠️ Riesgo moderado: aumentar monitoreo y riego según necesidad');
      } else if (indice < 80) {
        recs.push('🔍 Condiciones aceptables: monitorear salud y plagas');
      } else {
        recs.push('✅ Condiciones favorables');
      }
    }
    if (estado === 'malo') recs.unshift('❌ Estado crítico: considera intervención profesional');
    if (especie) recs.push(`📌 Especie: ${especie}`);
    return recs;
  }

    const generateZoneRecommendations = (lat?: number | string, lon?: number | string, riesgo?: string | null, indice?: number, especie?: string) => {
      const recs: string[] = []
      if (riesgo) {
        const r = String(riesgo).toLowerCase()
        if (r.includes('alto')) recs.push('⚠️ Riesgo ambiental alto en la zona: aumentar riego y monitoreo')
        else if (r.includes('medio')) recs.push('⚠️ Riesgo ambiental moderado: programar revisiones y control de plagas')
        else if (r.includes('bajo')) recs.push('ℹ️ Riesgo ambiental bajo: mantenimiento rutinario')
      }

      if (typeof indice === 'number') {
        if (indice < 50) recs.push('🚨 Índice bajo: intervención local (sombra/acolchado/riego)')
        else if (indice < 70) recs.push('🔍 Índice medio: revisar exposición solar y humedad del suelo')
        else recs.push('✅ Índice alto: condiciones favorables, mantener plan de cuidado')
      }

      try {
        const latNum = Number(lat)
        const lonNum = Number(lon)
        if (!Number.isNaN(latNum) && !Number.isNaN(lonNum)) {
          if (Math.abs(lonNum + 80.63) < 0.05) {
            recs.push('🌬️ Zona costera: proteger contra salitre y vientos fuertes')
          }
          if (latNum > -5.25 && latNum < -5.10) {
            recs.push('☀️ Alta exposición solar: considerar sombra temporal o riego por la mañana/tarde')
          }
        }
      } catch (e) {
        // ignore
      }

      if (especie) recs.push(`📌 Recomendación por especie: ajustar cuidados para ${especie}`)
      return recs
    }

  const normalizeTrees = (arr: any[]): TreeDistance[] => {
    return arr.map((t, idx) => {
      const safeId = t.id ?? t._id ?? t.usuario_id ?? `fallback-${idx}-${Date.now()}`;
      const weatherIndice = t.weather?.indice_supervivencia ?? t.indices?.indice_supervivencia ?? null;
      const indice = t.indice_supervivencia ?? weatherIndice ?? 75;
      const recomendaciones = t.recomendaciones ?? t.weather?.recomendaciones ?? t.recomendaciones_arbol ?? [];
      return {
        ...t,
        id: safeId,
        indice_supervivencia: indice,
        recomendaciones,
      } as TreeDistance;
    });
  }

  const calculateDistances = async (location: UserLocation | null) => {
    const baseLocation = location ?? userLocation ?? DEFAULT_PIURA_LOCATION;
    const distances = arboles
      .map((arbol) => {
        const lat = Number(arbol.latitud);
        const lon = Number(arbol.longitud);
        const distance = Number.isFinite(lat) && Number.isFinite(lon)
          ? calculateDistance(baseLocation.lat, baseLocation.lng, lat, lon)
          : null;

        return {
          ...arbol,
          distance,
        };
      })
      .filter((arbol) => arbol.distance != null)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

    // Obtener datos de clima para cada árbol
    const treesWithWeather = await Promise.all(
      distances.map(async (tree) => {
        try {
          const weatherRes = await fetch(
            `/geolocalizacion/api-clima?lat=${tree.latitud}&lon=${tree.longitud}&species=${encodeURIComponent(tree.especie || "")}`
          );
                    if (weatherRes.ok) {
                    const weatherData = await weatherRes.json();
                    const indice = weatherData.indices?.indice_supervivencia ?? 75;
                    const recomendaciones = weatherData.recomendaciones_arbol ?? generateLocalRecommendations(tree.especie, tree.estado_salud, indice);
                    const zoneRecs = generateZoneRecommendations(tree.latitud, tree.longitud, weatherData.indices?.riesgo_ambiental ?? null, indice, tree.especie)
                    const finalRecs = Array.isArray(recomendaciones) ? [...recomendaciones, ...zoneRecs] : [...zoneRecs]
                    return {
                      ...tree,
                      distance: tree.distance,
                      weather: {
                        temperatura: weatherData.current?.temperatura,
                        humedad: weatherData.current?.humedad,
                        descripcion: weatherData.current?.descripcion,
                        icono: weatherData.current?.icono,
                        indice_supervivencia: indice,
                        riesgo_ambiental: weatherData.indices?.riesgo_ambiental ?? 'desconocido',
                        recomendaciones: finalRecs,
                      },
                    };
          }
        } catch (error) {
          console.error("Error fetching weather for tree:", error);
        }
        return { ...tree, distance: tree.distance, weather: { indice_supervivencia: 75, recomendaciones: generateLocalRecommendations(tree.especie, tree.estado_salud, 75) } };
      })
    );

    setTreeDistances(normalizeTrees(treesWithWeather));
  };

  useEffect(() => {
    if (arboles.length > 0) {
      calculateDistances(userLocation);
    }
  }, [arboles, userLocation]);

  const mapMarkers = useMemo(() => [
    ...(userLocation
      ? [
          {
            lat: userLocation.lat,
            lng: userLocation.lng,
            popup: "<strong>📍 Tu ubicación actual</strong>",
          },
        ]
      : []),
    ...treeDistances
      .filter((arbol) => arbol.estado_salud && activeHealthFilters.includes(arbol.estado_salud))
      .map((a) => {
        let popupContent = `<div class="popup-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">`;
        
        // Nombre del árbol
        popupContent += `<div style="font-weight: bold; color: #1f2937; font-size: 14px; margin-bottom: 6px;">🌳 ${a.nombre}</div>`;
        
        // Especie
        if (a.especie) {
          popupContent += `<div style="color: #6b7280; font-size: 12px; margin-bottom: 6px;">🌿 ${a.especie}</div>`;
        }
        
        // Estado de salud
        if (a.estado_salud) {
          const healthColors: Record<string, string> = {
            EXCELENTE: "#0ea5e9",
            BUENO: "#16a34a",
            REGULAR: "#f59e0b",
            MALO: "#f97316",
            CRITICO: "#dc2626",
          };
          const healthLabels: Record<string, string> = {
            EXCELENTE: "🔵 Excelente",
            BUENO: "🟢 Bueno",
            REGULAR: "🟡 Regular",
            MALO: "🟠 Malo",
            CRITICO: "🔴 Crítico",
          };
          const color = healthColors[a.estado_salud] || "#6b7280";
          const label = healthLabels[a.estado_salud] || a.estado_salud;
          popupContent += `<div style="background: ${color}15; border-left: 3px solid ${color}; padding: 6px 8px; margin: 6px 0; border-radius: 3px; font-size: 12px; color: ${color}; font-weight: 600;">${label}</div>`;
        }
        
        // Distancia
        if (a.distance != null) {
          popupContent += `<div style="color: #16a34a; font-size: 12px; font-weight: 600; margin: 6px 0;">📏 ${a.distance.toFixed(2)} km</div>`;
        }
        
        // Información climática
        if (a.weather?.temperatura !== undefined || a.weather?.humedad !== undefined) {
          popupContent += `<div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 8px; border-radius: 4px; margin-top: 8px;">`;
          
          if (a.weather.temperatura !== undefined) {
            popupContent += `<div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #0369a1; font-weight: 600; margin-bottom: 4px;">🌡️ Temperatura: <span style="color: #ea580c; font-weight: bold;">${Math.round(a.weather.temperatura)}°C</span></div>`;
          }
          
          if (a.weather.humedad !== undefined) {
            popupContent += `<div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #0369a1; font-weight: 600;">💧 Humedad: <span style="color: #0284c7; font-weight: bold;">${Math.round(a.weather.humedad)}%</span></div>`;
          }
          
          popupContent += `</div>`;
        }
        
        // Mostrar sólo el índice de supervivencia (porcentaje) en el popup
        {
          const baseIndice = a.weather?.indice_supervivencia ?? a.indice_supervivencia ?? 75;
          const supervivenciaScore = getCoherentSurvivalScore(a.estado_salud, baseIndice, a.id);
          if (supervivenciaScore !== null) {
            popupContent += `<div style="background: #eef2ff; border-left: 3px solid #6366f1; padding: 6px 8px; margin-top: 8px; border-radius: 3px; font-size: 12px; color: #3730a3; font-weight: 600;">Índice de Supervivencia: <span style="font-weight: bold; color: #0f172a;">${supervivenciaScore}%</span></div>`;
          }
        }
        
        // Recomendaciones: mostrar todas (sin truncado)
        if (a.weather?.recomendaciones && a.weather.recomendaciones.length > 0) {
          popupContent += `<div style="background: #fef3c7; border-left: 3px solid #f59e0b; padding: 8px; border-radius: 3px; margin-top: 8px; font-size: 11px; color: #92400e;">`;
          a.weather.recomendaciones.forEach((rec: string) => {
            popupContent += `<div style="margin-bottom: 4px;">${rec}</div>`;
          });
          popupContent += `</div>`;
        }
        
        popupContent += `</div>`;
        
        return {
          lat: a.latitud,
          lng: a.longitud,
          healthStatus: a.estado_salud ? String(a.estado_salud).toLowerCase() : undefined,
          popup: popupContent,
          nombre: a.nombre,
          especie: a.especie,
          temperatura: a.weather?.temperatura,
          humedad: a.weather?.humedad,
          distance: a.distance,
          indice_supervivencia: a.weather?.indice_supervivencia ?? null,
          recomendaciones: a.weather?.recomendaciones ?? a.weather?.recomendaciones ?? [],
        };
      }),
  ], [userLocation, treeDistances, activeHealthFilters]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-96 mb-6" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
              <Compass className="h-8 w-8 text-green-600" />
              Geolocalización
            </h1>
            <p className="text-muted-foreground">
              Visualiza tu ubicación y los árboles más cercanos
            </p>
          </div>
          <Button
            onClick={() => {
              setLoading(true);
              fetchArboles();
            }}
            disabled={loading}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Refrescar
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {treeDistances.length > 0 && (
          <div className="mb-6">
            <HealthFilter
              activeFilters={activeHealthFilters}
              onFilterChange={setActiveHealthFilters}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Mapa Interactivo</CardTitle>
                  <Button
                    onClick={getGeolocation}
                    disabled={geoLoading}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    {geoLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Detectando...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4" />
                        Mi Ubicación
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <MapClusteringComponent
                    center={
                      userLocation
                        ? [userLocation.lat, userLocation.lng]
                        : [DEFAULT_PIURA_LOCATION.lat, DEFAULT_PIURA_LOCATION.lng]
                    }
                    // Cargar inicialmente en clusters (zoom inicial más lejano)
                    zoom={11}
                    markers={mapMarkers}
                    clusteringConfig={{
                      maxClusterRadius: 80,
                      showCoverageOnHover: false,
                      zoomToBoundsOnClick: true,
                      // Desagregar al acercar a zoom 15 o superior
                      disableClusteringAtZoom: 15,
                      // Si hay muchos marcadores en el mismo punto, desplegarlos tipo "spiderfy" al hacer clic
                      spiderfyOnMaxZoom: true,
                    }}
                  />
                </CardContent>
              </Card>

              {treeDistances.length > 0 && (
                <Card className="overflow-hidden border-0 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-emerald-100 p-2">
                        <MapPin className="h-4 w-4 text-emerald-700" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          Árboles Cercanos ({treeDistances.filter((arbol) => arbol.estado_salud && activeHealthFilters.includes(arbol.estado_salud)).length})
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Lista ordenada por distancia desde tu ubicación
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {treeDistances.filter((arbol) => arbol.estado_salud && activeHealthFilters.includes(arbol.estado_salud)).map((arbol, index) => (
                        <div
                          key={arbol.id}
                          className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-3 shadow-sm"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-sm text-emerald-800">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm line-clamp-1">{arbol.nombre}</h3>
                              {arbol.especie && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  🌿 {arbol.especie}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-sm font-bold text-emerald-700">
                              {arbol.distance != null ? `${arbol.distance.toFixed(2)} km` : "-"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-emerald-100 p-2">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Tu Ubicación</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ubicación actual detectada y lista para usar
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {userLocation ? (
                  <>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Estado
                        </p>
                        <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white">
                          Activa
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-emerald-800">
                        Tu posición ha sido detectada correctamente.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                          Latitud
                        </p>
                        <p className="mt-1 text-sm font-mono text-sky-800">
                          {userLocation.lat.toFixed(6)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                          Longitud
                        </p>
                        <p className="mt-1 text-sm font-mono text-blue-800">
                          {userLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={getGeolocation}
                      disabled={geoLoading}
                      className="w-full"
                      size="sm"
                      variant="outline"
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      Actualizar ubicación
                    </Button>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                      <MapPin className="h-6 w-6 text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      No se ha detectado tu ubicación
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Activa la detección para ver tu posición en el mapa.
                    </p>
                    <Button
                      onClick={getGeolocation}
                      disabled={geoLoading}
                      className="mt-4 w-full"
                      size="sm"
                    >
                      Detectar ubicación
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {userWeather && userWeather.current && (
              <Card className="overflow-hidden border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-sky-100 p-2">
                      <CloudSun className="h-4 w-4 text-sky-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Clima Actual</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Condiciones meteorológicas en tu zona
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                          🌡️ Temperatura
                        </p>
                        <p className="mt-1 text-3xl font-bold text-orange-600">
                          {Math.round(userWeather.current.temperatura)}°C
                        </p>
                      </div>
                      <div className="rounded-full bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-700">
                        Ahora
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-orange-700">
                      Sensación térmica: {Math.round(userWeather.current.sensacion_termica)}°C
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                          💧 Humedad
                        </p>
                        <p className="mt-1 text-3xl font-bold text-blue-600">
                          {Math.round(userWeather.current.humedad)}%
                        </p>
                      </div>
                      <div className="rounded-full bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700">
                        Aire
                      </div>
                    </div>
                  </div>

                  {userWeather.current.velocidad_viento !== undefined && (
                    <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-700">
                            💨 Viento
                          </p>
                          <p className="mt-1 text-xl font-semibold text-purple-700">
                            {userWeather.current.velocidad_viento != null
                              ? `${userWeather.current.velocidad_viento.toFixed(1)} m/s`
                              : "N/A"}
                          </p>
                        </div>
                        <div className="rounded-full bg-purple-100 px-3 py-2 text-sm font-semibold text-purple-700">
                          Fresco
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Se removió la tarjeta resumen de 'Riesgo Ambiental para Árboles' por petición del usuario. */}

            <Card className="overflow-hidden border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border-b">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-violet-100 p-2">
                    <Activity className="h-4 w-4 text-violet-700" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Estadísticas</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Resumen rápido de tus árboles cercanos
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                        Total de árboles
                      </p>
                      <p className="mt-1 text-3xl font-bold text-violet-800">{arboles.length}</p>
                    </div>
                    <div className="rounded-full bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-700">
                      Registrados
                    </div>
                  </div>
                </div>

                {treeDistances.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                        Más cercano
                      </p>
                      <p className="mt-1 text-xl font-bold text-emerald-800">
                        {treeDistances[0]?.distance != null ? `${treeDistances[0].distance.toFixed(2)} km` : "0.00 km"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        Más lejano
                      </p>
                      <p className="mt-1 text-xl font-bold text-amber-800">
                        {treeDistances.length > 0 && treeDistances[treeDistances.length - 1]?.distance != null ? `${treeDistances[treeDistances.length - 1]!.distance!.toFixed(2)} km` : "0.00 km"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {arboles.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <TreePine className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay árboles registrados</h3>
              <p className="text-muted-foreground mb-6">
                Registra tu primer árbol para verlo en el mapa
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
