"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TreePine, Camera, Calendar, TrendingUp, Plus, MapPin, Leaf } from "lucide-react";
import Link from "next/link";
import type { ArbolResumen, Seguimiento } from "@/types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [arboles, setArboles] = useState<ArbolResumen[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [arbolesRes, seguimientosRes] = await Promise.all([
        fetch("/api/arboles?mode=summary"),
        fetch("/api/seguimientos"),
      ]);

      if (arbolesRes.ok) {
        const arbolesData = await arbolesRes.json();
        setArboles(arbolesData);
      }

      if (seguimientosRes.ok) {
        const seguimientosData = await seguimientosRes.json();
        setSeguimientos(seguimientosData);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalArboles = arboles.length;
  const totalSeguimientos = seguimientos.length;
  const seguimientosEsteMes = seguimientos.filter((s) => {
    const fecha = new Date(s.fecha_seguimiento);
    const ahora = new Date();
    return (
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    );
  }).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="rounded-lg overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 flex flex-col items-start gap-6">
            <div className="w-full">
              <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-900 mb-2">
                ¡Bienvenid@, {session?.user?.name || "Usuario"}! <span className="text-emerald-700"></span>
              </h1>
              <p className="text-emerald-800/80 mb-4">
                Aquí tienes el resumen de tus árboles y seguimientos. Sigue registrando y cuidando nuestro planeta.
              </p>
              <Link href="/mi-arbol">
                <Button className="bg-emerald-800 hover:bg-emerald-900 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar nuevo árbol
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Árboles
              </CardTitle>
              <TreePine className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalArboles}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Árboles registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Seguimientos
              </CardTitle>
              <Camera className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalSeguimientos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registros totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Este Mes
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{seguimientosEsteMes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Seguimientos nuevos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Promedio
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {totalArboles > 0
                  ? (totalSeguimientos / totalArboles).toFixed(1)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Seguimientos por árbol
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions y Últimos Seguimientos lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <Link href="/mi-arbol" className="block">
                  <div className="p-4 bg-white dark:bg-secondary rounded-lg shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-md bg-green-50 flex items-center justify-center mb-3">
                      <Plus className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-sm font-medium">Registrar Nuevo Árbol</div>
                  </div>
                </Link>

                <Link href="/seguimientos" className="block">
                  <div className="p-4 bg-white dark:bg-secondary rounded-lg shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-md bg-blue-50 flex items-center justify-center mb-3">
                      <Camera className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-sm font-medium">Agregar Seguimiento</div>
                  </div>
                </Link>

                <Link href="/geolocalizacion" className="block">
                  <div className="p-4 bg-white dark:bg-secondary rounded-lg shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-md bg-violet-50 flex items-center justify-center mb-3">
                      <MapPin className="h-6 w-6 text-violet-600" />
                    </div>
                    <div className="text-sm font-medium">Ver Geolocalización</div>
                  </div>
                </Link>

                <Link href="/identificador" className="block">
                  <div className="p-4 bg-white dark:bg-secondary rounded-lg shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-md bg-emerald-50 flex items-center justify-center mb-3">
                      <Leaf className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="text-sm font-medium">Identificar Planta (IA)</div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimos Seguimientos</CardTitle>
            </CardHeader>
            <CardContent>
              {seguimientos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay seguimientos aún</p>
              ) : (
                <div className="space-y-3">
                  {seguimientos.slice(0, 3).map((seg) => (
                    <div key={seg.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{seg.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(seg.fecha_seguimiento).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mis Árboles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mis Árboles</CardTitle>
            <Link href="/mi-arbol">
              <Button size="sm">Ver Todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {arboles.length === 0 ? (
              <div className="text-center py-12">
                <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No tienes árboles registrados aún
                </p>
                <Link href="/mi-arbol">
                  <Button>Registrar Mi Primer Árbol</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {arboles.slice(0, 6).map((arbol) => (
                  <Card
                    key={arbol.id}
                    className="overflow-hidden h-full flex flex-col"
                  >
                    {/* Imagen con altura fija */}
                    <div className="w-full h-40 bg-secondary relative overflow-hidden">
                      {arbol.foto_url ? (
                        <img
                          src={arbol.foto_url || "/placeholder.svg"}
                          alt={arbol.nombre}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <TreePine className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <CardContent className="pt-4 flex-grow">
                      <h3 className="font-semibold mb-1">{arbol.nombre}</h3>
                      {arbol.especie && (
                        <p className="text-sm text-muted-foreground">
                          {arbol.especie}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
