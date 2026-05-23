"use client";

import type React from "react";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TreePine,
  MapPin,
  Plus,
  Trash2,
  Edit,
  Navigation,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TreePhotoForm } from "@/components/tree-photo-form";
import { ChatbotPanel } from "@/components/chatbot-panel";
import type { Arbol } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  getHealthStyles,
  getHealthLabel,
  getHealthEmoji,
} from "@/lib/health-utils";

// Importar MapComponent dinámicamente para evitar problemas de SSR
const DynamicMapComponent = dynamic(
  () =>
    import("@/components/map-component").then((mod) => ({
      default: mod.MapComponent,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-lg border-2 border-primary/20 bg-secondary animate-pulse" />
    ),
  },
);

export default function MiArbolPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [arboles, setArboles] = useState<Arbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArbol, setEditingArbol] = useState<Arbol | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [newCoordinates, setNewCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    especie: "",
    latitud: -5.1946,
    longitud: -80.6307,
    fecha_plantacion: "",
    descripcion: "",
    foto_url: "",
  });

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

  // Obtener geolocalización automáticamente
  const getGeolocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalización no disponible",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive",
      });
      return;
    }

    // Verificar si se está usando HTTPS (requerido en móviles)
    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      toast({
        title: "HTTPS Requerido",
        description:
          "La geolocalización requiere una conexión HTTPS segura en dispositivos móviles",
        variant: "destructive",
      });
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitud: latitude,
          longitud: longitude,
        }));
        toast({
          title: "Ubicación detectada",
          description: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        });
        setGeoLoading(false);
      },
      (error) => {
        console.error("Error de geolocalización:", error);

        let errorMessage = "No pudimos detectar tu ubicación.";
        let errorTitle = "Error de ubicación";

        // Identificar el tipo de error específico
        if (error.code === 1) {
          // PERMISSION_DENIED
          errorTitle = "Permisos denegados";
          errorMessage =
            "Por favor habilita los permisos de ubicación en la configuración de tu navegador.";
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          errorTitle = "Ubicación no disponible";
          errorMessage =
            "No se pudo obtener tu ubicación. Verifica que el GPS esté activado.";
        } else if (error.code === 3) {
          // TIMEOUT
          errorTitle = "Tiempo agotado";
          errorMessage = "La solicitud tardó demasiado. Intenta nuevamente.";
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true, // Activa GPS en móviles
        timeout: 15000, // Aumentado a 15 segundos para móviles
        maximumAge: 0, // No usar datos en caché
      },
    );
  };

  const fetchArboles = async () => {
    try {
      const res = await fetch("/api/arboles?mode=full");
      if (res.ok) {
        const data = await res.json();
        setArboles(data);
      }
    } catch (error) {
      console.error("Error al cargar árboles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.latitud || !formData.longitud) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = editingArbol
        ? `/api/arboles/${editingArbol.id}`
        : "/api/arboles";
      const method = editingArbol ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: "Éxito",
          description: editingArbol
            ? "Árbol actualizado correctamente"
            : "Árbol registrado correctamente",
        });
        setDialogOpen(false);
        resetForm();
        fetchArboles();
      } else {
        throw new Error("Error al guardar árbol");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el árbol",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este árbol?")) return;

    try {
      const res = await fetch(`/api/arboles/${id}`, { method: "DELETE" });

      if (res.ok) {
        toast({ title: "Árbol eliminado correctamente" });
        fetchArboles();
      } else {
        const error = await res.json();
        throw new Error(error.error || "No se pudo eliminar el árbol");
      }
    } catch (error) {
      console.error("Error al eliminar árbol:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el árbol",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      especie: "",
      latitud: -5.1946,
      longitud: -80.6307,
      fecha_plantacion: "",
      descripcion: "",
      foto_url: "",
    });
    setEditingArbol(null);
    setIsChangingLocation(false);
    setShowLocationConfirm(false);
    setNewCoordinates(null);
  };

  const confirmLocationChange = () => {
    if (newCoordinates) {
      setFormData((prev) => ({
        ...prev,
        latitud: newCoordinates.lat,
        longitud: newCoordinates.lng,
      }));
      toast({
        title: "Ubicación actualizada",
        description: `Nuevas coordenadas: ${newCoordinates.lat.toFixed(4)}, ${newCoordinates.lng.toFixed(4)}`,
      });
      setShowLocationConfirm(false);
      setNewCoordinates(null);
      setIsChangingLocation(false);
    }
  };

  const cancelLocationChange = () => {
    setShowLocationConfirm(false);
    setNewCoordinates(null);
  };

  const openEditDialog = (arbol: Arbol) => {
    setEditingArbol(arbol);
    setFormData({
      nombre: arbol.nombre,
      especie: arbol.especie || "",
      latitud: arbol.latitud,
      longitud: arbol.longitud,
      fecha_plantacion: arbol.fecha_plantacion
        ? new Date(arbol.fecha_plantacion).toISOString().split("T")[0]
        : "",
      descripcion: arbol.descripcion || "",
      foto_url: arbol.foto_url || "",
    });
    setDialogOpen(true);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Header skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>

            {/* Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-[140px] w-full rounded-none" />
                  <CardContent className="p-3 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-32" />
                    <div className="flex gap-1.5 pt-2">
                      <Skeleton className="h-7 flex-1" />
                      <Skeleton className="h-7 flex-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Mis Árboles 🌳
            </h1>
            <p className="text-gray-600 text-lg">
              Gestiona y visualiza todos tus árboles plantados. Rastrear el
              crecimiento es importante.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
                size="lg"
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-shadow"
              >
                <Plus className="h-5 w-5" />
                Registrar Nuevo Árbol
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-2xl max-h-[90vh] overflow-y-auto"
              onOpenAutoFocus={() => {
                // Solo ejecutar geolocalización si es un árbol NUEVO
                if (!editingArbol) {
                  getGeolocation();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TreePine className="h-5 w-5 text-green-600" />
                  {editingArbol ? "Editar Árbol" : "Registrar Nuevo Árbol"}
                </DialogTitle>
                <DialogDescription>
                  {editingArbol
                    ? "Actualiza la información de tu árbol"
                    : "Completa los datos para registrar tu nuevo árbol"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sección: Información Básica */}
                <div className="border-l-4 pl-4">
                  <h3 className="font-semibold text-sm text-green-700 mb-3 flex items-center gap-1">
                    <span className="text-base">ℹ️</span> Información Básica
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="font-semibold">
                        Nombre del Árbol <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        placeholder="Ej: Mi primer roble"
                        required
                        className="border-green-200 focus:border-green-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Dale un nombre descriptivo a tu árbol
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="fecha_plantacion"
                        className="font-semibold"
                      >
                        Fecha de Plantación
                      </Label>
                      <Input
                        id="fecha_plantacion"
                        type="date"
                        value={formData.fecha_plantacion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fecha_plantacion: e.target.value,
                          })
                        }
                        className="border-green-200 focus:border-green-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recuerda cuándo lo plantaste
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección: Identificación de Especie */}
                <div className="border-l-4 pl-4">
                  <h3 className="font-semibold text-sm text-blue-700 mb-3 flex items-center gap-1">
                    <span className="text-base">📸</span> Foto e Identificación
                  </h3>
                  {/* Componente unificado: Foto + Identificación automática de especie */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                    <TreePhotoForm
                      onPhotoIdentified={(result) => {
                        setFormData({
                          ...formData,
                          especie: result.species,
                          foto_url: result.photo,
                          descripcion:
                            result.careInstructions || formData.descripcion,
                        });
                        toast({
                          title: "✓ Foto y especie listas",
                          description: `${result.species} (${result.scientificName}) - ${Math.round(result.confidence * 100)}%`,
                        });
                      }}
                      initialPhoto={formData.foto_url}
                      initialSpecies={formData.especie}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="especie" className="font-semibold">
                        Especie <span className="text-red-500">*</span>{" "}
                        {formData.especie && (
                          <span className="text-green-600 text-xs ml-1">
                            ✓ Identificada
                          </span>
                        )}
                      </Label>
                      <Input
                        id="especie"
                        value={formData.especie}
                        onChange={(e) =>
                          setFormData({ ...formData, especie: e.target.value })
                        }
                        placeholder="Ej: Roble (auto-completada)"
                        required
                        className="border-blue-200 focus:border-blue-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Se completa automáticamente con la foto
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion" className="font-semibold">
                      Descripción & Cuidados
                    </Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descripcion: e.target.value,
                        })
                      }
                      placeholder="Describe tu árbol y cuidados especiales..."
                      rows={3}
                      className="border-blue-200 focus:border-blue-500 resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.descripcion.length} caracteres
                    </p>
                  </div>
                </div>

                {/* Sección: Ubicación en Mapa */}
                <div className="border-l-4 pl-4">
                  <h3 className="font-semibold text-sm text-purple-700 mb-3 flex items-center gap-1">
                    <span className="text-base"></span> Ubicación en el Mapa
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Coordenadas <span className="text-red-500">*</span>
                      </span>
                      <div className="flex gap-2">
                        {!editingArbol && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={getGeolocation}
                            disabled={geoLoading}
                            className="gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 hover:bg-green-100"
                          >
                            {geoLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Detectando...
                              </>
                            ) : (
                              <>
                                <Navigation className="h-4 w-4" />
                                Mi ubicación
                              </>
                            )}
                          </Button>
                        )}
                        {editingArbol && (
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              isChangingLocation ? "destructive" : "outline"
                            }
                            onClick={() =>
                              setIsChangingLocation(!isChangingLocation)
                            }
                            className="gap-2"
                          >
                            {isChangingLocation
                              ? "Cancelar cambio"
                              : "Cambiar ubicación"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {editingArbol && isChangingLocation && (
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
                        <p className="text-yellow-900 font-semibold text-sm">
                          ⚠️ Modo cambio de ubicación
                        </p>
                        <p className="text-yellow-800 text-xs mt-1">
                          Haz clic en el mapa para seleccionar la nueva
                          ubicación. Se te pedirá confirmación.
                        </p>
                      </div>
                    )}

                    <DynamicMapComponent
                      center={[
                        formData.latitud || -5.1946,
                        formData.longitud || -80.6307,
                      ]}
                      zoom={13}
                      onLocationSelect={(lat, lng) => {
                        if (editingArbol && !isChangingLocation) {
                          return;
                        }

                        if (isChangingLocation && editingArbol) {
                          setNewCoordinates({ lat, lng });
                          setShowLocationConfirm(true);
                          return;
                        }

                        if (!editingArbol) {
                          setFormData({
                            ...formData,
                            latitud: lat,
                            longitud: lng,
                          });
                          toast({
                            title: "✓ Ubicación actualizada",
                            description: `Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                          });
                        }
                      }}
                      markers={
                        formData.latitud && formData.longitud
                          ? [
                              {
                                lat: formData.latitud,
                                lng: formData.longitud,
                                popup: formData.nombre || "Ubicación del árbol",
                              },
                            ]
                          : []
                      }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-900">
                          Ubicación guardada:
                        </p>
                        <p className="text-xs text-blue-800 font-mono">
                          {(
                            Number(editingArbol?.latitud || formData.latitud) ||
                            0
                          ).toFixed(6)}
                          ,{" "}
                          {(
                            Number(
                              editingArbol?.longitud || formData.longitud,
                            ) || 0
                          ).toFixed(6)}
                        </p>
                      </div>

                      {isChangingLocation && newCoordinates && (
                        <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                          <p className="text-xs font-semibold text-green-900">
                            ✓ Nueva ubicación:
                          </p>
                          <p className="text-xs text-green-800 font-mono">
                            {newCoordinates.lat.toFixed(6)},{" "}
                            {newCoordinates.lng.toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>

                    {!editingArbol && (
                      <p className="text-xs text-muted-foreground italic">
                        Haz clic en el mapa o usa "Mi ubicación"
                      </p>
                    )}

                    {editingArbol && !isChangingLocation && (
                      <p className="text-xs text-muted-foreground italic">
                        Ubicación protegida. Presiona "Cambiar ubicación" para
                        modificarla.
                      </p>
                    )}
                  </div>
                </div>

                {/* Sección: Acciones */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      className="min-w-[120px]"
                    >
                      ✕ Cancelar
                    </Button>
                    <Button type="submit" className="min-w-[120px]">
                      {editingArbol ? "Actualizar" : "Registrar"}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {arboles.length === 0 ? (
          <Card className="border-2 border-dashed border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="text-center py-16">
              <div className="mb-4">
                <TreePine className="h-20 w-20 text-green-300 mx-auto mb-4 opacity-75" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">
                ¡Comienza tu viaje verde! 🌱
              </h3>
              <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                Aún no tienes árboles registrados. Registra tu primer árbol y
                comienza a rastrear su crecimiento.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                size="lg"
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Plus className="h-5 w-5" />
                Registrar Mi Primer Árbol
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {arboles.map((arbol) => (
                <Card
                  key={arbol.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-200 h-full flex flex-col border border-gray-200 hover:border-green-300 group"
                >
                  {/* Imagen Compacta */}
                  <div className="h-[140px] bg-gradient-to-br from-green-100 to-emerald-100 relative flex-shrink-0 overflow-hidden">
                    {arbol.foto_url ? (
                      <img
                        src={arbol.foto_url || "/placeholder.svg"}
                        alt={arbol.nombre}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-100 to-emerald-100">
                        <TreePine className="h-12 w-12 text-green-300 opacity-40" />
                      </div>
                    )}
                    {arbol.especie && (
                      <div className="absolute top-1.5 right-1.5 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
                        {arbol.especie.split(" ")[0]}
                      </div>
                    )}
                  </div>

                  {/* Contenido Condensado */}
                  <CardContent className="p-3 flex-1 flex flex-col gap-2">
                    {/* Nombre y Especie */}
                    <div className="min-h-[2.5rem]">
                      <h3 className="font-bold text-sm leading-tight line-clamp-2 text-gray-900 group-hover:text-green-700 transition-colors">
                        {arbol.nombre}
                      </h3>
                    </div>

                    {/* Estado de Salud - Badge Compacto */}
                    {arbol.estado_salud && (
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium border ${getHealthStyles(arbol.estado_salud).bgColor} ${getHealthStyles(arbol.estado_salud).textColor} ${getHealthStyles(arbol.estado_salud).borderColor}`}
                      >
                        {getHealthEmoji(arbol.estado_salud)} {getHealthLabel(arbol.estado_salud)}
                      </div>
                    )}

                    {/* Descripción Opcional - 1 línea */}
                    {arbol.descripcion && (
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {arbol.descripcion}
                      </p>
                    )}

                    {/* Fecha y Ubicación - Inline Compacto */}
                    <div className="space-y-1 text-xs text-gray-500">
                      {arbol.fecha_plantacion && (
                        <p className="line-clamp-1">
                          📅 {new Date(arbol.fecha_plantacion).toLocaleDateString("es-ES", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      <p className="line-clamp-1 font-mono text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0 text-purple-600" />
                        {Number(arbol.latitud).toFixed(4)}, {Number(arbol.longitud).toFixed(4)}
                      </p>
                    </div>

                    {/* Botones Compactos */}
                    <div className="flex gap-1.5 mt-auto pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-7 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium"
                        onClick={() => openEditDialog(arbol)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-7 text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium"
                        onClick={() => handleDelete(arbol.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <AlertDialog
        open={showLocationConfirm}
        onOpenChange={setShowLocationConfirm}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">⚠️</span> Confirmar Traslado del Árbol
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-4 space-y-3">
              <p className="font-semibold text-foreground">
                ¿Estás seguro de trasladar este árbol?
              </p>

              <div className="bg-red-50 p-3 rounded-lg border border-red-200 space-y-1">
                <p className="text-xs font-semibold text-red-900">
                  Ubicación Actual:
                </p>
                <p className="text-sm text-red-800 font-mono">
                  {editingArbol
                    ? Number(editingArbol.latitud).toFixed(6)
                    : "N/A"}
                  ,{" "}
                  {editingArbol
                    ? Number(editingArbol.longitud).toFixed(6)
                    : "N/A"}
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg border border-green-200 space-y-1">
                <p className="text-xs font-semibold text-green-900">
                  Nueva Ubicación:
                </p>
                <p className="text-sm text-green-800 font-mono">
                  {newCoordinates?.lat.toFixed(6)},{" "}
                  {newCoordinates?.lng.toFixed(6)}
                </p>
              </div>

              <p className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                Esta acción no se puede deshacer fácilmente. Asegúrate de que
                las coordenadas sean correctas.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-6">
            <AlertDialogCancel
              onClick={cancelLocationChange}
              className="min-w-[120px]"
            >
              ✕ Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLocationChange}
              className="min-w-[120px] bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              ✓ Confirmar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <ChatbotPanel />
      <Footer />
    </div>
  );
}
