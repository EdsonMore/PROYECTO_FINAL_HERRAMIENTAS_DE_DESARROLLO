// components/navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Leaf, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { NavbarAvatar } from "@/components/navbar-avatar";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Llamar a API de logout explícito primero
      await fetch("/api/auth/logout", { method: "POST" });
      
      // Luego hacer signOut de NextAuth
      await signOut({ redirectUrl: "/" });
    } catch (error) {
      console.error("Error durante logout:", error);
      // Si falla, intentar redirect manual
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Inicio", protected: false },
    { href: "/dashboard", label: "Dashboard", protected: true },
    { href: "/mi-arbol", label: "Mi Árbol", protected: true },
    { href: "/seguimientos", label: "Seguimientos", protected: true },
    { href: "/identificador", label: "Identificador IA", protected: true },
    { href: "/beneficios", label: "Beneficios", protected: false },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-[#28254D] text-white backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-white"
          >
            <Image
              src="/img/arbol_logo.webp"
              alt="Logo ReVerdecer Piura"
              width={45}
              height={45}
              style={{ width: "45px", height: "45px" }}
              className="rounded"
            />
            <span className="text-white text-base sm:text-lg md:text-xl font-bold">
              ReVerdecer Piura
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => {
              // Mostrar links públicos siempre, links protegidos solo si está logueado
              if (link.protected && status !== "authenticated") {
                return null
              }
              
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive(link.href) ? "default" : "ghost"}
                    size="sm"
                    className={`text-sm ${isActive(link.href)
                      ? "bg-white text-[#28254D]"
                      : "text-white hover:bg-white/20"
                      }`}
                  >
                    {link.label}
                  </Button>
                </Link>
              )
            })}

            {session ? (
              // Avatar + dropdown
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 rounded-full hover:bg-white/10 px-2 py-1 transition"
                >
                  <NavbarAvatar
                    email={session.user?.email ?? undefined}
                    userName={session.user?.name ?? undefined}
                    size={35}
                  />
                  <span className="text-white font-medium">
                    {session.user?.name || "Usuario"}
                  </span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg text-[#28254D] overflow-hidden z-50">
                    <Link
                      href="/perfil"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        Mi Perfil
                      </div>
                    </Link>
                    <div
                      className="px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
                      onClick={handleSignOut}
                    >
                      Cerrar Sesión
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/registro">
                  <Button
                    size="sm"
                    className="bg-white text-[#28254D] hover:bg-white/90"
                  >
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-white/20">
            {navLinks.map((link) => {
              // Mostrar links públicos siempre, links protegidos solo si está logueado
              if (link.protected && status !== "authenticated") {
                return null
              }
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive(link.href) ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-start ${isActive(link.href)
                      ? "bg-white text-[#28254D]"
                      : "text-white hover:bg-white/20"
                      }`}
                  >
                    {link.label}
                  </Button>
                </Link>
              )
            })}

            {session ? (
              <>
                <Link href="/perfil" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-white/20"
                  >
                    Mi Perfil
                  </Button>
                </Link>

                <div className="flex items-center gap-2 px-2 py-1">
                  <NavbarAvatar
                    email={session.user?.email ?? undefined}
                    userName={session.user?.name ?? undefined}
                    size={30}
                  />
                  <span className="text-white font-medium">
                    {session.user?.name}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={handleSignOut}
                >
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-white hover:bg-white/20"
                  >
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/registro" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    size="sm"
                    className="w-full justify-start bg-white text-[#28254D] hover:bg-white/90"
                  >
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
