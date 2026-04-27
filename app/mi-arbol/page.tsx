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

// Importar MapComponent dinámicamente para evitar problemas de SSR
const DynamicMapComponent = dynamic(() => import("@/components/map-component").then(mod => ({ default: mod.MapComponent })), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full rounded-lg border-2 border-primary/20 bg-secondary animate-pulse" />
});

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
  const [newCoordinates, setNewCoordinates] = useState<{ lat: number; lng: number } | null>(null);
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
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      toast({
        title: "HTTPS Requerido",
        description: "La geolocalización requiere una conexión HTTPS segura en dispositivos móviles",
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
          errorMessage = "Por favor habilita los permisos de ubicación en la configuración de tu navegador.";
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          errorTitle = "Ubicación no disponible";
          errorMessage = "No se pudo obtener tu ubicación. Verifica que el GPS esté activado.";
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
        enableHighAccuracy: true,  // Activa GPS en móviles
        timeout: 15000,             // Aumentado a 15 segundos para móviles
        maximumAge: 0               // No usar datos en caché
      }
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
        description: error instanceof Error ? error.message : "No se pudo eliminar el árbol",
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
          <Skeleton className="h-10 w-64 mb-8" />
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Mis Árboles</h1>
            <p className="text-muted-foreground">
              Gestiona y visualiza todos tus árboles plantados
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Árbol
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
                <DialogTitle>
                  {editingArbol ? "Editar Árbol" : "Registrar Nuevo Árbol"}
                </DialogTitle>
                <DialogDescription>
                  {editingArbol
                    ? "Actualiza la información de tu árbol"
                    : "Completa los datos para registrar tu nuevo árbol"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Árbol *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      placeholder="Ej: Mi primer roble"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha_plantacion">
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
                    />
                  </div>
                </div>

                {/* Componente unificado: Foto + Identificación automática de especie */}
                <TreePhotoForm
                  onPhotoIdentified={(result) => {
                    setFormData({
                      ...formData,
                      especie: result.species,
                      foto_url: result.photo,
                      descripcion: result.careInstructions || formData.descripcion,
                    });
                    toast({
                      title: "✓ Foto y especie listas",
                      description: `${result.species} (${result.scientificName}) - ${Math.round(result.confidence * 100)}%`,
                    });
                  }}
                  initialPhoto={formData.foto_url}
                  initialSpecies={formData.especie}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="especie">Especie *</Label>
                    <Input
                      id="especie"
                      value={formData.especie}
                      onChange={(e) =>
                        setFormData({ ...formData, especie: e.target.value })
                      }
                      placeholder="Ej: Roble (auto-completada)"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción (Auto-completada con cuidados)</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    placeholder="Describe tu árbol..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Ubicación en el Mapa *</Label>
                    <div className="flex gap-2">
                      {!editingArbol && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={getGeolocation}
                          disabled={geoLoading}
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
                              Mi ubicación
                            </>
                          )}
                        </Button>
                      )}
                      {editingArbol && (
                        <Button
                          type="button"
                          size="sm"
                          variant={isChangingLocation ? "destructive" : "outline"}
                          onClick={() => setIsChangingLocation(!isChangingLocation)}
                          className="gap-2"
                        >
                          {isChangingLocation ? "Cancelar cambio" : "Cambiar ubicación"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {editingArbol && isChangingLocation && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm mb-3">
                      <p className="text-yellow-800 font-semibold">⚠️ Modo cambio de ubicación activado</p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Haz clic en el mapa donde deseas trasladar el árbol. Se te pedirá confirmación antes de guardar.
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
                      // Si está editando y NO activó cambio de ubicación = ignorar
                      if (editingArbol && !isChangingLocation) {
                        return;
                      }
                      
                      // Si está en modo cambio de ubicación = mostrar confirmación
                      if (isChangingLocation && editingArbol) {
                        setNewCoordinates({ lat, lng });
                        setShowLocationConfirm(true);
                        return;
                      }
                      
                      // Si está creando árbol nuevo = actualizar directamente
                      if (!editingArbol) {
                        setFormData({ ...formData, latitud: lat, longitud: lng });
                        toast({
                          title: "Ubicación actualizada",
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
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <p className="text-xs font-semibold text-blue-900">📍 Ubicación actual guardada:</p>
                    <p className="text-xs text-blue-800">
                      Lat: {(Number(editingArbol?.latitud || formData.latitud) || 0).toFixed(6)} | 
                      Lng: {(Number(editingArbol?.longitud || formData.longitud) || 0).toFixed(6)}
                    </p>
                  </div>

                  {isChangingLocation && newCoordinates && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                      <p className="text-xs font-semibold text-green-900">✓ Nueva ubicación seleccionada:</p>
                      <p className="text-xs text-green-800">
                        Lat: {newCoordinates.lat.toFixed(6)} | Lng: {newCoordinates.lng.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {!editingArbol && (
                    <p className="text-xs text-muted-foreground">
                      📍 Haz clic en el mapa para cambiar la ubicación o usa el botón "Mi ubicación"
                    </p>
                  )}
                  
                  {editingArbol && !isChangingLocation && (
                    <p className="text-xs text-muted-foreground">
                      🔒 Ubicación protegida. Presiona "Cambiar ubicación" si necesitas modificarla.
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingArbol ? "Actualizar" : "Registrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {arboles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <TreePine className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No tienes árboles registrados
              </h3>
              <p className="text-muted-foreground mb-6">
                Comienza registrando tu primer árbol
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Mi Primer Árbol
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {arboles.map((arbol) => (
                <Card
                  key={arbol.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col"
                >
                  <div className="h-[240px] bg-secondary relative flex-shrink-0 overflow-hidden">
                    {arbol.foto_url ? (
                      <img
                        src={arbol.foto_url || "/placeholder.svg"}
                        alt={arbol.nombre}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <TreePine className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {arbol.nombre}
                    </h3>
                    {arbol.especie && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {arbol.especie}
                      </p>
                    )}
                    {arbol.descripcion && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {arbol.descripcion}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 line-clamp-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {Number(arbol.latitud).toFixed(4)},{" "}
                        {Number(arbol.longitud).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => openEditDialog(arbol)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                        onClick={() => handleDelete(arbol.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Mapa de Todos los Árboles</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicMapComponent
                  center={
                    arboles.length > 0
                      ? [arboles[0].latitud, arboles[0].longitud]
                      : [-5.1946, -80.6307]
                  }
                  zoom={11}
                  markers={arboles.map((a) => ({
                    lat: a.latitud,
                    lng: a.longitud,
                    popup: `<strong>${a.nombre}</strong>${
                      a.especie ? `<br/>${a.especie}` : ""
                    }`,
                  }))}
                />
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <AlertDialog open={showLocationConfirm} onOpenChange={setShowLocationConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Confirmar cambio de ubicación</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mt-3 space-y-2">
                <p className="font-semibold text-foreground">¿Estás seguro de trasladar este árbol?</p>
                
                <div className="bg-red-50 p-2 rounded border border-red-200">
                  <p className="text-xs font-semibold text-red-900">Ubicación actual:</p>
                  <p className="text-xs text-red-700">
                    Lat: {editingArbol ? Number(editingArbol.latitud).toFixed(6) : "N/A"} | 
                    Lng: {editingArbol ? Number(editingArbol.longitud).toFixed(6) : "N/A"}
                  </p>
                </div>

                <div className="bg-green-50 p-2 rounded border border-green-200">
                  <p className="text-xs font-semibold text-green-900">Nueva ubicación:</p>
                  <p className="text-xs text-green-700">
                    Lat: {newCoordinates?.lat.toFixed(6)} | Lng: {newCoordinates?.lng.toFixed(6)}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground italic">
                  Esta acción no se puede deshacer fácilmente. Asegúrate de que las nuevas coordenadas son correctas.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel onClick={cancelLocationChange}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLocationChange} className="bg-green-600 hover:bg-green-700">
              Confirmar traslado
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <ChatbotPanel />
      <Footer />
    </div>
  );
}
