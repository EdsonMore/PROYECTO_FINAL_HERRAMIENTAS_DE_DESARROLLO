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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HealthFilter } from "@/components/health-filter";
import { getHealthLabel } from "@/lib/health-utils";
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
  distance: number;
  weather?: WeatherInfo;
}

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
  const [activeHealthFilters, setActiveHealthFilters] = useState<string[]>(["excelente", "regular", "malo"]);
  const [activeTreeFilters, setActiveTreeFilters] = useState<string[]>(["excelente", "regular", "malo"]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
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
            setUserWeather(weatherData);
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

  const calculateDistances = async (location: UserLocation) => {
    const distances = arboles
      .map((arbol) => ({
        ...arbol,
        distance: calculateDistance(
          location.lat,
          location.lng,
          Number(arbol.latitud),
          Number(arbol.longitud)
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    // Obtener datos de clima para cada árbol
    const treesWithWeather = await Promise.all(
      distances.map(async (tree) => {
        try {
          const weatherRes = await fetch(
            `/geolocalizacion/api-clima?lat=${tree.latitud}&lon=${tree.longitud}&species=${encodeURIComponent(tree.especie || "")}`
          );
          if (weatherRes.ok) {
            const weatherData = await weatherRes.json();
            return {
              ...tree,
              weather: {
                temperatura: weatherData.current?.temperatura,
                humedad: weatherData.current?.humedad,
                descripcion: weatherData.current?.descripcion,
                icono: weatherData.current?.icono,
                indice_supervivencia: weatherData.indices?.indice_supervivencia,
                riesgo_ambiental: weatherData.indices?.riesgo_ambiental,
                recomendaciones: weatherData.recomendaciones_arbol,
              },
            };
          }
        } catch (error) {
          console.error("Error fetching weather for tree:", error);
        }
        return tree;
      })
    );

    setTreeDistances(treesWithWeather);
  };

  useEffect(() => {
    if (userLocation && arboles.length > 0) {
      calculateDistances(userLocation);
    }
  }, [arboles]);

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
      .filter((arbol) => !arbol.estado_salud || activeHealthFilters.includes(arbol.estado_salud))
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
            excelente: "#22c55e",
            regular: "#f59e0b",
            malo: "#ef4444",
          };
          const healthLabels: Record<string, string> = {
            excelente: "✅ Excelente",
            regular: "⚠️ Regular",
            malo: "❌ Crítico",
          };
          const color = healthColors[a.estado_salud] || "#6b7280";
          const label = healthLabels[a.estado_salud] || a.estado_salud;
          popupContent += `<div style="background: ${color}15; border-left: 3px solid ${color}; padding: 6px 8px; margin: 6px 0; border-radius: 3px; font-size: 12px; color: ${color}; font-weight: 600;">${label}</div>`;
        }
        
        // Distancia
        if (a.distance) {
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
        
        // Riesgo Ambiental y Supervivencia
        if (a.weather?.riesgo_ambiental !== undefined || a.weather?.indice_supervivencia !== undefined) {
          const riesgoColors: Record<string, string> = {
           bajo: "#22c55e",
           moderado: "#f59e0b",
           alto: "#ef4444",
           crítico: "#7f1d1d",
          };
          const riesgoLabels: Record<string, string> = {
           bajo: "✅ Bajo",
           moderado: "⚠️ Moderado",
           alto: "🔴 Alto",
           crítico: "🚨 Crítico",
          };
          
          const riesgoColor = riesgoColors[a.weather.riesgo_ambiental || ""] || "#6b7280";
          const riesgoLabel = riesgoLabels[a.weather.riesgo_ambiental || ""] || "Desconocido";
          
          popupContent += `<div style="background: ${riesgoColor}20; border: 2px solid ${riesgoColor}; padding: 8px; border-radius: 4px; margin-top: 8px;">`;
          popupContent += `<div style="font-weight: bold; color: ${riesgoColor}; margin-bottom: 6px; font-size: 13px;">📊 Riesgo Ambiental</div>`;
          popupContent += `<div style="color: ${riesgoColor}; font-weight: 600; font-size: 12px; margin-bottom: 4px;">${riesgoLabel}</div>`;
          
          if (a.weather.indice_supervivencia !== undefined) {
           const supervivenciaScore = Math.round(a.weather.indice_supervivencia);
           popupContent += `<div style="font-size: 11px; color: #6b7280;">Índice de Supervivencia: <span style="font-weight: bold; color: ${riesgoColor};">${supervivenciaScore}%</span></div>`;
          }
          
          popupContent += `</div>`;
        }
        
        // Recomendaciones
        if (a.weather?.recomendaciones && a.weather.recomendaciones.length > 0) {
          popupContent += `<div style="background: #fef3c7; border-left: 3px solid #f59e0b; padding: 8px; border-radius: 3px; margin-top: 8px; font-size: 11px; color: #92400e;">`;
          a.weather.recomendaciones.slice(0, 2).forEach((rec: string) => {
           popupContent += `<div style="margin-bottom: 3px;">${rec}</div>`;
          });
          if (a.weather.recomendaciones.length > 2) {
           popupContent += `<div style="font-size: 10px; font-style: italic;">+${a.weather.recomendaciones.length - 2} más...</div>`;
          }
          popupContent += `</div>`;
        }
        
        popupContent += `</div>`;
        
        return {
          lat: a.latitud,
          lng: a.longitud,
          healthStatus: a.estado_salud,
          popup: popupContent,
          nombre: a.nombre,
          especie: a.especie,
          temperatura: a.weather?.temperatura,
          humedad: a.weather?.humedad,
          distance: a.distance,
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtrar por Estado de Salud</CardTitle>
            </CardHeader>
            <CardContent>
              <HealthFilter
                activeFilters={activeHealthFilters}
                onFilterChange={setActiveHealthFilters}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
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
                      : [-5.1946, -80.6307]
                  }
                  zoom={13}
                  markers={mapMarkers}
                  clusteringConfig={{
                    maxClusterRadius: 80,
                    showCoverageOnHover: true,
                    zoomToBoundsOnClick: true,
                    disableClusteringAtZoom: 15,
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tu Ubicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userLocation ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-900 font-semibold">Latitud</p>
                      <p className="text-sm font-mono text-green-700">
                        {userLocation.lat.toFixed(6)}
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-900 font-semibold">Longitud</p>
                      <p className="text-sm font-mono text-blue-700">
                        {userLocation.lng.toFixed(6)}
                      </p>
                    </div>
                    <Button
                      onClick={getGeolocation}
                      disabled={geoLoading}
                      className="w-full"
                      size="sm"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No se ha detectado ubicación
                    </p>
                    <Button
                      onClick={getGeolocation}
                      disabled={geoLoading}
                      className="w-full mt-3"
                      size="sm"
                    >
                      Detectar Ubicación
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {userWeather && userWeather.current && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                     Clima Actual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-xs text-orange-900 font-semibold">🌡️ Temperatura</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {Math.round(userWeather.current.temperatura)}°C
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      Sensación: {Math.round(userWeather.current.sensacion_termica)}°C
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900 font-semibold">💧 Humedad</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(userWeather.current.humedad)}%
                    </p>
                  </div>
                  {userWeather.current.velocidad_viento !== undefined && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs text-purple-900 font-semibold">💨 Viento</p>
                      <p className="text-sm font-semibold text-purple-700">
                        {(userWeather.current.velocidad_viento).toFixed(1)} m/s
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {userWeather && userWeather.indices && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    📊 Riesgo Ambiental para Árboles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const riesgo = userWeather.indices.riesgo_ambiental;
                    const riesgoColors: Record<string, string> = {
                      bajo: "bg-green-50 border-green-200 text-green-900",
                      moderado: "bg-yellow-50 border-yellow-200 text-yellow-900",
                      alto: "bg-orange-50 border-orange-200 text-orange-900",
                      crítico: "bg-red-50 border-red-200 text-red-900",
                    };
                    const riesgoEmojis: Record<string, string> = {
                      bajo: "✅",
                      moderado: "⚠️",
                      alto: "🔴",
                      crítico: "🚨",
                    };
                    const riesgoLabels: Record<string, string> = {
                      bajo: "Bajo - Condiciones favorables",
                      moderado: "Moderado - Monitoreo recomendado",
                      alto: "Alto - Intervención necesaria",
                      crítico: "Crítico - Condiciones extremas",
                    };
                    return (
                      <div className={`border-2 rounded-lg p-4 ${riesgoColors[riesgo] || riesgoColors.moderado}`}>
                        <div className="font-bold text-lg mb-2">
                          {riesgoEmojis[riesgo] || "❓"} {riesgoLabels[riesgo] || "Desconocido"}
                        </div>
                        <div className="text-sm mb-3">
                          Índice de Supervivencia: <span className="font-bold text-lg">{Math.round(userWeather.indices.indice_supervivencia)}%</span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div>💧 Riesgo de Sequedad: <span className="font-semibold">{userWeather.indices.riesgo_sequedad}</span></div>
                          <div>🌡️ Índice de Calor: <span className="font-semibold">{userWeather.indices.indice_calor}</span></div>
                          <div>☀️ Índice UV: <span className="font-semibold">{userWeather.indices.indice_uv.toFixed(1)}</span></div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-primary/10 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total de Árboles</p>
                  <p className="text-2xl font-bold text-primary">{arboles.length}</p>
                </div>
                {treeDistances.length > 0 && (
                  <>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-green-900 font-semibold">Árbol Más Cercano</p>
                      <p className="text-sm text-green-700">
                        {treeDistances[0].distance.toFixed(2)} km
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-xs text-orange-900 font-semibold">Árbol Más Lejano</p>
                      <p className="text-sm text-orange-700">
                        {treeDistances[treeDistances.length - 1].distance.toFixed(2)} km
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {treeDistances.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Árboles Cercanos a tu Ubicación ({treeDistances.filter((arbol) => !arbol.estado_salud || activeHealthFilters.includes(arbol.estado_salud)).length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {treeDistances.filter((arbol) => !arbol.estado_salud || activeHealthFilters.includes(arbol.estado_salud)).map((arbol, index) => (
                  <div
                    key={arbol.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
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
                      <div className="text-sm font-bold text-green-600">
                        {arbol.distance.toFixed(2)} km
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {arbol.estado_salud ? `Estado: ${arbol.estado_salud}` : "Sin estado"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
