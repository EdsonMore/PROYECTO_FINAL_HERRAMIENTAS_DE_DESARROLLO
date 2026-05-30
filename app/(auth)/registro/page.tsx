"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { validatePassword, isValidEmail, isValidName } from "@/lib/password-utils";
import { Leaf, Loader2, Eye, EyeOff, Check, X } from "lucide-react";

export default function RegistroPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
  });

  // Usar validador del backend
  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  // Validación de email
  const isEmailValid = formData.email ? isValidEmail(formData.email) : true;

  // Validación de nombre y apellido
  const isNombreValid = formData.nombre ? isValidName(formData.nombre) : true;
  const isApellidoValid = formData.apellido ? isValidName(formData.apellido) : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones en cliente
    if (!isNombreValid) {
      toast({
        title: "Nombre inválido",
        description: "El nombre debe tener al menos 2 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!isApellidoValid) {
      toast({
        title: "Apellido inválido",
        description: "El apellido debe tener al menos 2 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!isEmailValid) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: "Contraseña no segura",
        description: "Por favor cumple con todos los requisitos de seguridad",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          telefono: formData.telefono.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar");
      }

      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
      });

      router.push("/login");
    } catch (error: any) {
      toast({
        title: "Error al registrar",
        description: error.message || "Ocurrió un error al crear tu cuenta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-secondary/30 to-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>
            Regístrate para comenzar a cuidar tus árboles
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Nombre y Apellido - En una fila */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className={!isNombreValid && formData.nombre ? "border-red-500" : ""}
                />
                {!isNombreValid && formData.nombre && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Mínimo 2 caracteres
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  type="text"
                  placeholder="Pérez"
                  value={formData.apellido}
                  onChange={(e) =>
                    setFormData({ ...formData, apellido: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className={!isApellidoValid && formData.apellido ? "border-red-500" : ""}
                />
                {!isApellidoValid && formData.apellido && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Mínimo 2 caracteres
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
                className={!isEmailValid && formData.email ? "border-red-500" : ""}
              />
              {!isEmailValid && formData.email && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Email inválido
                </p>
              )}
              {isEmailValid && formData.email && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Email válido
                </p>
              )}
            </div>

            {/* Teléfono (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono (Opcional)</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="+34 612 345 678"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Para notificaciones y contacto
              </p>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Crea una contraseña segura"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Indicadores de validación */}
              {formData.password && (
                <div className="space-y-1 text-xs mt-2 p-3 bg-secondary/50 rounded-lg">
                  <p className="font-semibold mb-1">Requisitos de seguridad:</p>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordValidation.length
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {passwordValidation.length ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordValidation.uppercase
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {passwordValidation.uppercase ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span>Al menos una mayúscula (A-Z)</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordValidation.lowercase
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {passwordValidation.lowercase ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span>Al menos una minúscula (a-z)</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordValidation.number
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {passwordValidation.number ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span>Al menos un número (0-9)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Las contraseñas no coinciden
                  </p>
                )}
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Las contraseñas coinciden
                  </p>
                )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || !isPasswordValid || !isEmailValid || !isNombreValid || !isApellidoValid}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Inicia sesión aquí
              </Link>
            </p>
            <p className="text-sm text-center">
              <Link href="/" className="text-primary hover:underline">
                ← Volver a la página principal
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
