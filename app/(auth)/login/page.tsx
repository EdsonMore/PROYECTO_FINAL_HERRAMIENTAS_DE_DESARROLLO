// app/(auth)/login/page.tsx
"use client";

import type React from "react";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Leaf, Loader2, Eye, EyeOff, Chrome } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", {
        callbackUrl: searchParams.get("callbackUrl") || "/dashboard",
      });
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Error al iniciar sesión con Google",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setIsLoading(false);
        toast({
          title: "Error al iniciar sesión",
          description: "Email o contraseña incorrectos",
          variant: "destructive",
        });
      } else if (result?.ok) {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        });
        
        // Esperar a que se establezca la sesión
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Obtener la URL de redirección del callback
        const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
        
        // Redirigir inmediatamente sin esperar más
        window.location.href = callbackUrl;
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Ocurrió un error al iniciar sesión",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-secondary/30 to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
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
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted-foreground/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
              </div>
            </div>

            {/* Botón de Google */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full gap-2" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Chrome className="h-4 w-4" />
              Iniciar sesión con Google
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link
                href="/registro"
                className="text-primary hover:underline font-medium"
              >
                Regístrate aquí
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
