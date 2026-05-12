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
  TreePine,
  Loader2,
  Navigation,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HealthFilter } from "@/components/health-filter";
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

interface TreeDistance extends Arbol {
  distance: number;
}

export default function MostrarArbolesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [arboles, setArboles] = useState<Arbol[]>([]);
  const [loading, setLoading] = useState(true);
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
    }
  }, [status]);

  const fetchArboles = async () => {
    try {
      setLoading(true);
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

  const filteredArboles = arboles.filter(
    (arbol) => !arbol.estado_salud || activeHealthFilters.includes(arbol.estado_salud)
  );

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
              <TreePine className="h-8 w-8 text-green-600" />
              Mostrar Árboles
            </h1>
            <p className="text-muted-foreground">
              Visualiza todos tus árboles en el mapa
            </p>
          </div>
          <Button
            onClick={fetchArboles}
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

        {arboles.length > 0 && (
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

        {arboles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Mapa de Árboles</CardTitle>
                </CardHeader>
                <CardContent>
                  <DynamicMapComponent
                    center={[-5.1946, -80.6307]}
                    zoom={13}
                    markers={filteredArboles.map((a) => ({
                      lat: a.latitud,
                      lng: a.longitud,
                      healthStatus: a.estado_salud,
                      popup: `<div class="font-semibold text-sm text-gray-900">${a.nombre}</div>${
                        a.especie ? `<div class="text-xs text-gray-600">🌿 ${a.especie}</div>` : ""
                      }${
                        a.estado_salud
                          ? `<div class="text-xs text-gray-600 mt-1">Estado: ${getHealthLabel(a.estado_salud)}</div>`
                          : ""
                      }`,
                    }))}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-primary/10 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Total de Árboles</p>
                    <p className="text-2xl font-bold text-primary">{arboles.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-green-900 font-semibold">Excelentes</p>
                    <p className="text-xl font-bold text-green-700">
                      {arboles.filter((a) => a.estado_salud === "excelente").length}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <p className="text-xs text-yellow-900 font-semibold">Regular</p>
                    <p className="text-xl font-bold text-yellow-700">
                      {arboles.filter((a) => a.estado_salud === "regular").length}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-red-900 font-semibold">Críticos</p>
                    <p className="text-xl font-bold text-red-700">
                      {arboles.filter((a) => a.estado_salud === "malo").length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {arboles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mis Árboles ({filteredArboles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArboles.map((arbol) => (
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
                        {getHealthLabel(arbol.estado_salud)}
                      </div>
                    )}
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
              <p className="text-muted-foreground">
                Registra tu primer árbol para verlo aquí
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
