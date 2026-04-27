"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Camera, Plus, Trash2, CalendarIcon, Edit, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CalendarComponent } from "@/components/calendar-component"
import { ImageUploader } from "@/components/image-uploader"
import type { ArbolResumen, Seguimiento } from "@/types"
import { useToast } from "@/hooks/use-toast"

export default function SeguimientosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [arboles, setArboles] = useState<ArbolResumen[]>([])
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSeguimiento, setEditingSeguimiento] = useState<Seguimiento | null>(null)
  const [selectedSeguimiento, setSelectedSeguimiento] = useState<Seguimiento | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [formData, setFormData] = useState({
    arbol_id: "",
    titulo: "",
    descripcion: "",
    foto_url: "",
    altura_cm: "",
    salud: "",
    fecha_seguimiento: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      const [arbolesRes, seguimientosRes] = await Promise.all([
        fetch("/api/arboles?mode=summary"),
        fetch("/api/seguimientos"),
      ])

      if (arbolesRes.ok) {
        const arbolesData = await arbolesRes.json()
        setArboles(arbolesData)
      }

      if (seguimientosRes.ok) {
        const seguimientosData = await seguimientosRes.json()
        setSeguimientos(seguimientosData)
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.arbol_id || !formData.titulo) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingSeguimiento ? `/api/seguimientos/${editingSeguimiento.id}` : "/api/seguimientos"
      const method = editingSeguimiento ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          arbol_id: Number.parseInt(formData.arbol_id),
          altura_cm: formData.altura_cm ? Number.parseFloat(formData.altura_cm) : null,
        }),
      })

      if (res.ok) {
        toast({
          title: "Éxito",
          description: editingSeguimiento ? "Seguimiento actualizado correctamente" : "Seguimiento registrado correctamente",
        })
        setDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        throw new Error("Error al guardar seguimiento")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el seguimiento",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const res = await fetch(`/api/seguimientos/${deletingId}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Seguimiento eliminado correctamente" })
        fetchData()
        setDeleteConfirmOpen(false)
        setDeletingId(null)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el seguimiento",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      arbol_id: "",
      titulo: "",
      descripcion: "",
      foto_url: "",
      altura_cm: "",
      salud: "",
      fecha_seguimiento: new Date().toISOString().split("T")[0],
    })
    setEditingSeguimiento(null)
  }

  const openEditDialog = (seg: Seguimiento) => {
    setEditingSeguimiento(seg)
    
    // Convertir la fecha al formato YYYY-MM-DD
    let fechaFormateada = ""
    
    if (typeof seg.fecha_seguimiento === "string") {
      // Si es string en formato DD/MM/YYYY, convertir a YYYY-MM-DD
      if (seg.fecha_seguimiento.includes("/")) {
        const [dia, mes, año] = seg.fecha_seguimiento.split("/")
        fechaFormateada = `${año}-${mes}-${dia}`
      } else if (seg.fecha_seguimiento.match(/^\d{4}-\d{2}-\d{2}/)) {
        // Ya está en formato YYYY-MM-DD o similar
        fechaFormateada = seg.fecha_seguimiento.split("T")[0]
      } else {
        // Intentar parsear como fecha estándar
        const date = new Date(seg.fecha_seguimiento)
        fechaFormateada = date.toISOString().split("T")[0]
      }
    } else if (seg.fecha_seguimiento instanceof Date) {
      fechaFormateada = seg.fecha_seguimiento.toISOString().split("T")[0]
    }
    
    setFormData({
      arbol_id: seg.arbol_id.toString(),
      titulo: seg.titulo,
      descripcion: seg.descripcion || "",
      foto_url: seg.foto_url || "",
      altura_cm: seg.altura_cm ? seg.altura_cm.toString() : "",
      salud: seg.salud || "",
      fecha_seguimiento: fechaFormateada,
    })
    setDialogOpen(true)
  }

  const openDetailModal = (seg: Seguimiento) => {
    setSelectedSeguimiento(seg)
    setShowDetailModal(true)
  }

  const openDeleteConfirm = (id: number) => {
    setDeletingId(id)
    setDeleteConfirmOpen(true)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
        </main>
        <Footer />
      </div>
    )
  }

  const calendarEvents = seguimientos.map((seg) => ({
    id: seg.id.toString(),
    title: seg.titulo,
    start: new Date(seg.fecha_seguimiento),
    allDay: true,
    extendedProps: {
      arbol_nombre: seg.arbol_nombre,
      descripcion: seg.descripcion,
      seguimiento: seg,
    },
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Seguimientos</h1>
            <p className="text-muted-foreground">Documenta el crecimiento de tus árboles</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Lista
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Calendario
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Seguimiento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSeguimiento ? "Editar Seguimiento" : "Registrar Nuevo Seguimiento"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSeguimiento
                      ? "Actualiza la información de tu seguimiento"
                      : "Documenta el estado actual de tu árbol con fotos y medidas"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="arbol_id">Árbol *</Label>
                    <Select
                      value={formData.arbol_id}
                      onValueChange={(value) => setFormData({ ...formData, arbol_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un árbol" />
                      </SelectTrigger>
                      <SelectContent>
                        {arboles.map((arbol) => (
                          <SelectItem key={arbol.id} value={arbol.id.toString()}>
                            {arbol.nombre} {arbol.especie && `(${arbol.especie})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título *</Label>
                      <Input
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder="Ej: Primera poda"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fecha_seguimiento">Fecha</Label>
                      <Input
                        id="fecha_seguimiento"
                        type="date"
                        value={formData.fecha_seguimiento}
                        onChange={(e) => setFormData({ ...formData, fecha_seguimiento: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="altura_cm">Altura (cm)</Label>
                      <Input
                        id="altura_cm"
                        type="number"
                        value={formData.altura_cm}
                        onChange={(e) => setFormData({ ...formData, altura_cm: e.target.value })}
                        placeholder="150"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salud">Estado de Salud</Label>
                      <Select
                        value={formData.salud}
                        onValueChange={(value) => setFormData({ ...formData, salud: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excelente">🟢 Excelente</SelectItem>
                          <SelectItem value="bueno">🟢 Bueno</SelectItem>
                          <SelectItem value="regular">🟡 Regular</SelectItem>
                          <SelectItem value="malo">🔴 Malo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Foto del Seguimiento</Label>
                    <ImageUploader
                      onImageSelect={(base64) =>
                        setFormData({ ...formData, foto_url: base64 })
                      }
                      initialImage={formData.foto_url}
                      label="Seleccionar Foto"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Notas</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Describe el estado del árbol, cambios observados, etc."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false)
                        resetForm()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">{editingSeguimiento ? "Actualizar" : "Registrar"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {arboles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Primero registra un árbol</h3>
              <p className="text-muted-foreground mb-6">
                Necesitas tener al menos un árbol registrado para crear seguimientos
              </p>
              <Button onClick={() => router.push("/mi-arbol")}>Ir a Mis Árboles</Button>
            </CardContent>
          </Card>
        ) : viewMode === "calendar" ? (
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-2xl">📅 Calendario de Seguimientos</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {seguimientos.length} seguimiento{seguimientos.length !== 1 ? "s" : ""} registrado{seguimientos.length !== 1 ? "s" : ""}
                </p>
              </CardHeader>
              <CardContent className="pt-6 px-2 sm:px-6 overflow-x-auto">
                <div className="min-w-full">
                  <CalendarComponent 
                    events={calendarEvents}
                    onEventClick={(event) => {
                      const seg = event.extendedProps?.seguimiento
                      if (seg) openDetailModal(seg)
                    }}
                  />
                </div>
              </CardContent>
            </Card>
            
            {seguimientos.length > 0 && (
              <Card className="border-0 shadow-sm bg-blue-50 border-l-4 border-l-blue-400">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">💡 Tip:</span> Haz clic en cualquier evento del calendario para ver detalles completos, editar o eliminar el seguimiento.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : seguimientos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes seguimientos registrados</h3>
              <p className="text-muted-foreground mb-6">Comienza documentando el crecimiento de tus árboles</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Mi Primer Seguimiento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seguimientos.map((seg) => (
              <Card
                key={seg.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group h-full flex flex-col"
                onClick={() => openDetailModal(seg)}
              >
                <div className="h-[240px] bg-gradient-to-br from-secondary to-secondary/50 relative overflow-hidden flex-shrink-0">
                  {seg.foto_url ? (
                    <img
                      src={seg.foto_url || "/placeholder.svg"}
                      alt={seg.titulo}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full group-hover:bg-secondary/80 transition-colors">
                      <Camera className="h-16 w-16 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                    <div className="bg-white/90 text-foreground px-4 py-2 rounded-lg text-sm font-semibold">
                      Ver detalles
                    </div>
                  </div>
                </div>

                <CardContent className="pt-4 flex-1 flex flex-col">
                  <div className="mb-2">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">{seg.titulo}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{seg.arbol_nombre}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                        {new Date(seg.fecha_seguimiento).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {seg.descripcion && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{seg.descripcion}</p>
                  )}

                  <div className="space-y-1 text-xs text-muted-foreground mb-4 pb-3 border-b">
                    {seg.altura_cm && (
                      <div className="flex justify-between">
                        <span>📏 Altura:</span>
                        <span className="font-semibold text-foreground">{seg.altura_cm} cm</span>
                      </div>
                    )}
                    {seg.salud && (
                      <div className="flex justify-between">
                        <span>
                          {seg.salud === "excelente" && "🟢"}
                          {seg.salud === "bueno" && "🟢"}
                          {seg.salud === "regular" && "🟡"}
                          {seg.salud === "malo" && "🔴"} Estado:
                        </span>
                        <span className="font-semibold text-foreground capitalize">{seg.salud}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 hover:bg-primary hover:text-primary-foreground"
                      onClick={() => openEditDialog(seg)}
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => openDeleteConfirm(seg.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal detallado de seguimiento */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{selectedSeguimiento?.titulo}</DialogTitle>
              <DialogDescription className="mt-2">{selectedSeguimiento?.arbol_nombre}</DialogDescription>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>

          {selectedSeguimiento && (
            <div className="space-y-4">
              {selectedSeguimiento.foto_url && (
                <div className="w-full h-[300px] rounded-lg overflow-hidden border-2 border-primary/20">
                  <img
                    src={selectedSeguimiento.foto_url}
                    alt={selectedSeguimiento.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="text-lg font-semibold">
                    {new Date(selectedSeguimiento.fecha_seguimiento).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {selectedSeguimiento.altura_cm && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Altura</p>
                    <p className="text-lg font-semibold">{selectedSeguimiento.altura_cm} cm</p>
                  </div>
                )}

                {selectedSeguimiento.salud && (
                  <div className={`p-3 rounded-lg ${
                    selectedSeguimiento.salud === "excelente" || selectedSeguimiento.salud === "bueno"
                      ? "bg-green-50"
                      : selectedSeguimiento.salud === "regular"
                        ? "bg-yellow-50"
                        : "bg-red-50"
                  }`}>
                    <p className="text-xs text-muted-foreground">Estado de Salud</p>
                    <p className="text-lg font-semibold capitalize flex items-center gap-2">
                      {selectedSeguimiento.salud === "excelente" && "🟢"}
                      {selectedSeguimiento.salud === "bueno" && "🟢"}
                      {selectedSeguimiento.salud === "regular" && "🟡"}
                      {selectedSeguimiento.salud === "malo" && "🔴"}
                      {selectedSeguimiento.salud}
                    </p>
                  </div>
                )}
              </div>

              {selectedSeguimiento.descripcion && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Notas</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedSeguimiento.descripcion}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => {
                    setShowDetailModal(false)
                    openEditDialog(selectedSeguimiento)
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailModal(false)
                    openDeleteConfirm(selectedSeguimiento.id)
                  }}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar seguimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el seguimiento y todos sus datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
