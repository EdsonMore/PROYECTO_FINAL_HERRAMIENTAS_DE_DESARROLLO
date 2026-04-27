// components/footer.tsx
import { Leaf, Heart, Users, Info, BookOpen } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-lg text-primary">
              <img
                src="/img/arbol_logo.webp"
                width={60}
                height={60}
                alt="logo de la pagina"
                className="rounded"
              />
              <span>EcoData IA</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plataforma que conecta a personas con la naturaleza, fomentando el
              cuidado y seguimiento de árboles en nuestra comunidad.
            </p>
          </div>

          {/* Enlaces Rápidos */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> Enlaces Rápidos
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/seguimientos"
                  className="hover:text-primary transition-colors"
                >
                  Seguimientos
                </Link>
              </li>
              <li>
                <Link
                  href="/beneficios"
                  className="hover:text-primary transition-colors"
                >
                  Beneficios
                </Link>
              </li>
            </ul>
          </div>

          {/* Comunidad */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-1">
              <Users className="h-4 w-4" /> Comunidad
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/perfil"
                  className="hover:text-primary transition-colors"
                >
                  Mi Perfil
                </Link>
              </li>
              <li>
                <Link
                  href="/mi-arbol"
                  className="hover:text-primary transition-colors"
                >
                  Mi Árbol
                </Link>
              </li>
            </ul>
          </div>

          {/* Información */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-1">
              <Info className="h-4 w-4" /> Sobre Nosotros
            </h3>
            <p className="text-sm text-muted-foreground">
              Somos un equipo comprometido con el medio ambiente, promoviendo la
              reforestación y el cuidado de la naturaleza. Cada acción cuenta.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            Hecho con{" "}
            <Heart className="h-4 w-4 text-destructive fill-destructive" /> y
            pasión por el planeta
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} EcoData IA. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
