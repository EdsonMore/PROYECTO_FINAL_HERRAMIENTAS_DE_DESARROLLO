"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
import { FiltrosMapa } from "@/components/filtros-mapa";
import { getHealthLabel } from "@/lib/health-utils";
import type { Arbol } from "@/types";

const DynamicMapComponent = dynamic(
  () => import("@/components/map-component").then((mod) => ({ default: mod.MapComponent })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full rounded-lg border-2 border-primary/20 bg-secondary animate-pulse" />
    ),
  }
);

interface UserLocation {
  lat: number;
  lng: number;
}

interface TreeDistance extends Arbol {
  distance: number;
}

export default function GeolocalizacionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [arboles, setArboles] = useState<Arbol[]>([]);
  const [treeDistances, setTreeDistances] = useState<TreeDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeHealthFilters, setActiveHealthFilters] = useState<string[]>(["excelente", "regular", "malo"]);

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
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
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
      const res = await fetch("/api/arboles?mode=geo");
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

  const calculateDistances = (location: UserLocation) => {
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

    setTreeDistances(distances);
  };

  useEffect(() => {
    if (userLocation && arboles.length > 0) {
      calculateDistances(userLocation);
    }
  }, [arboles]);

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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
            <Compass className="h-8 w-8 text-green-600" />
            Geolocalización
          </h1>
          <p className="text-muted-foreground">
            Visualiza tu ubicación y los árboles más cercanos
          </p>
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
              <CardTitle>Mis Árboles Creados ({arboles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {arboles.map((arbol) => (
                  <div
                    key={arbol.id}
                    className="p-4 rounded-lg border hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    <h3 className="font-semibold text-sm mb-1">{arbol.nombre}</h3>
                    {arbol.especie && (
                      <p className="text-xs text-muted-foreground mb-2">🌿 {arbol.especie}</p>
                    )}
                    {arbol.estado_salud && (
                      <div className="text-xs inline-block px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                        {arbol.estado_salud}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {treeDistances.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros Mapa</CardTitle>
            </CardHeader>
            <CardContent>
              <FiltrosMapa
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
                <DynamicMapComponent
                  center={
                    userLocation
                      ? [userLocation.lat, userLocation.lng]
                      : [-5.1946, -80.6307]
                  }
                  zoom={13}
                  markers={[
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
                      .map((a) => ({
                        lat: a.latitud,
                        lng: a.longitud,
                        healthStatus: a.estado_salud,
                        popup: `<div class="font-semibold text-sm text-gray-900">${a.nombre}</div>${
                          a.especie ? `<div class="text-xs text-gray-600">🌿 ${a.especie}</div>` : ""
                        }${
                          a.distance
                            ? `<div class="text-xs text-green-600 font-semibold mt-1">📏 ${a.distance.toFixed(2)} km</div>`
                            : ""
                        }`,
                      })),
                  ]}
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Mis Árboles Creados ({arboles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {arboles.map((arbol) => (
                  <div
                    key={arbol.id}
                    className="p-4 rounded-lg border hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    <h3 className="font-semibold text-sm mb-1">{arbol.nombre}</h3>
                    {arbol.especie && (
                      <p className="text-xs text-muted-foreground mb-2">🌿 {arbol.especie}</p>
                    )}
                    {arbol.estado_salud && (
                      <div className="text-xs inline-block px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                        {arbol.estado_salud}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
              <CardTitle>Mis Árboles Creados ({arboles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {arboles.map((arbol) => (
                  <div
                    key={arbol.id}
                    className="p-4 rounded-lg border hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    <h3 className="font-semibold text-sm mb-1">{arbol.nombre}</h3>
                    {arbol.especie && (
                      <p className="text-xs text-muted-foreground mb-2">🌿 {arbol.especie}</p>
                    )}
                    {arbol.estado_salud && (
                      <div className="text-xs inline-block px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                        {arbol.estado_salud}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {treeDistances.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Árboles Cercanos ({treeDistances.filter((arbol) => !arbol.estado_salud || activeHealthFilters.includes(arbol.estado_salud)).length})</CardTitle>
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
