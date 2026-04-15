"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  User,
  Mail,
  Calendar,
  TreePine,
  Eye,
  EyeOff,
  Save,
  LogOut,
  Upload,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/user-avatar";

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  avatar_url: string;
  fecha_registro: string;
}

export default function PerfilPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    avatar_url: "",
    password_actual: "",
    nueva_password: "",
    confirmar_password: "",
  });
  const [showPassword, setShowPassword] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });
  const [stats, setStats] = useState({
    totalArboles: 0,
    totalSeguimientos: 0,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadUserProfile();
      fetchStats();
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.image && userProfile) {
      setFormData((prev) => ({
        ...prev,
        avatar_url: session.user.image || prev.avatar_url,
      }));
    }
  }, [session?.user?.image]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch("/api/perfil");
      if (response.ok) {
        const profileData = await response.json();
        setUserProfile(profileData);
        setFormData((prev) => ({
          ...prev,
          nombre: profileData.nombre,
          avatar_url: profileData.avatar_url || "",
        }));
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del perfil",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const [arbolesRes, seguimientosRes] = await Promise.all([
        fetch("/api/arboles"),
        fetch("/api/seguimientos"),
      ]);

      if (arbolesRes.ok && seguimientosRes.ok) {
        const arboles = await arbolesRes.json();
        const seguimientos = await seguimientosRes.json();
        setStats({
          totalArboles: arboles.length,
          totalSeguimientos: seguimientos.length,
        });
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      // Validar contraseñas si se están cambiando
      if (formData.nueva_password) {
        if (formData.nueva_password !== formData.confirmar_password) {
          toast({
            title: "Error",
            description: "Las contraseñas nuevas no coinciden",
            variant: "destructive",
          });
          setUpdating(false);
          return;
        }

        if (!formData.password_actual) {
          toast({
            title: "Error",
            description: "Debes ingresar tu contraseña actual para cambiarla",
            variant: "destructive",
          });
          setUpdating(false);
          return;
        }
      }

      const updateData: any = {
        nombre: formData.nombre,
        avatar_url: formData.avatar_url,
      };

      // Solo incluir campos de contraseña si se están cambiando
      if (formData.password_actual && formData.nueva_password) {
        updateData.password_actual = formData.password_actual;
        updateData.nueva_password = formData.nueva_password;
      }

      const response = await fetch("/api/perfil", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "¡Éxito!",
          description: "Perfil actualizado correctamente",
        });

        // Actualizar la sesión con los nuevos datos (sin incluir el avatar grande)
        await update({
          ...session,
          user: {
            ...session?.user,
            name: result.usuario.nombre,
            // No incluir image para evitar headers demasiado grandes
          },
        });

        // Actualizar el perfil local
        setUserProfile(result.usuario);
        setPreviewUrl(null);

        // Limpiar campos de contraseña
        setFormData((prev) => ({
          ...prev,
          password_actual: "",
          nueva_password: "",
          confirmar_password: "",
        }));
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar perfil",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast({
        title: "Error",
        description: "Error al actualizar perfil",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen válida",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setPreviewUrl(base64);
        setFormData((prev) => ({
          ...prev,
          avatar_url: base64,
        }));
        toast({
          title: "Imagen cargada",
          description: "Haz clic en 'Guardar Cambios' para confirmar",
        });
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error al procesar imagen:", error);
      toast({
        title: "Error",
        description: "Error al procesar la imagen",
        variant: "destructive",
      });
      setUploadingImage(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 lg:col-span-1" />
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const userInitials =
    userProfile?.nombre
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const registrationDate = userProfile?.fecha_registro
    ? new Date(userProfile.fecha_registro).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().getFullYear().toString();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y preferencias
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Personal */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <UserAvatar
                    src={
                      previewUrl ||
                      userProfile?.avatar_url ||
                      session?.user?.image ||
                      ""
                    }
                    alt={userProfile?.nombre || session?.user?.name || "Avatar"}
                    fallback={userInitials}
                    size="xl"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md"
                  >
                    <Upload className="h-4 w-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </div>
                <h3 className="text-xl font-semibold text-center">
                  {userProfile?.nombre || session?.user?.name}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {userProfile?.email || session?.user?.email}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Haz clic en el ícono de cámara para cambiar tu foto
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Usuario activo</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {userProfile?.email || session?.user?.email}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Miembro desde el{" "}
                    {userProfile?.fecha_registro
                      ? new Date(userProfile.fecha_registro).toLocaleDateString(
                          "es-PE",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "Fecha no disponible"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TreePine className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalArboles}</p>
                      <p className="text-sm text-muted-foreground">
                        Árboles Registrados
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {stats.totalSeguimientos}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Seguimientos Totales
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editar Perfil */}
            <Card>
              <CardHeader>
                <CardTitle>Editar Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">Foto de Perfil</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="avatar_url"
                          name="avatar_url"
                          value={formData.avatar_url ? "Imagen cargada" : ""}
                          disabled
                          className="bg-muted"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="whitespace-nowrap"
                          onClick={() =>
                            document.getElementById("avatar-upload")?.click()
                          }
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Seleccionar
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sube una imagen JPG, PNG o WebP (máx. 5MB)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userProfile?.email || session?.user?.email || ""}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">
                        El correo electrónico no se puede modificar
                      </p>
                    </div>
                  </div>

                  {/* Cambio de Contraseña */}
                  <Collapsible
                    className="border-t pt-6"
                    open={showPasswordSection}
                    onOpenChange={setShowPasswordSection}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Cambiar Contraseña</h4>

                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {showPasswordSection ? "Ocultar" : "Mostrar"}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="password_actual">
                            Contraseña Actual
                          </Label>
                          <div className="relative">
                            <Input
                              id="password_actual"
                              name="password_actual"
                              type={showPassword.actual ? "text" : "password"}
                              value={formData.password_actual}
                              onChange={handleInputChange}
                              placeholder="Ingresa tu contraseña actual"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => togglePasswordVisibility("actual")}
                            >
                              {showPassword.actual ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nueva_password">
                            Nueva Contraseña
                          </Label>
                          <div className="relative">
                            <Input
                              id="nueva_password"
                              name="nueva_password"
                              type={showPassword.nueva ? "text" : "password"}
                              value={formData.nueva_password}
                              onChange={handleInputChange}
                              placeholder="Ingresa tu nueva contraseña"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => togglePasswordVisibility("nueva")}
                            >
                              {showPassword.nueva ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmar_password">
                            Confirmar Nueva Contraseña
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmar_password"
                              name="confirmar_password"
                              type={
                                showPassword.confirmar ? "text" : "password"
                              }
                              value={formData.confirmar_password}
                              onChange={handleInputChange}
                              placeholder="Confirma tu nueva contraseña"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                togglePasswordVisibility("confirmar")
                              }
                            >
                              {showPassword.confirmar ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={updating}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updating ? "Guardando..." : "Guardar Cambios"}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      variant="outline"
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
