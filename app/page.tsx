"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Leaf, MapPin, Camera, Calendar, BookOpen, Sprout, User, BarChart, Heart } from "lucide-react";
import AnimatedHeading from "@/components/animated-heading";

export default function HomePage() {
  const { data: session } = useSession();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section: imagen de fondo con texto superpuesto */}
        <section className="relative h-[60vh] md:h-[72vh] flex items-center">
          <div className="absolute inset-0 z-0">
            <img
              src="/img/EcoDataIA (2).png"
              alt="EcoData IA - árbol"
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 60%" }}
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>

          <div className="container mx-auto relative z-10 text-center">
            <h1 className="text-5xl md:text-8xl font-extrabold text-white">
              EcoData IA
            </h1>
            <p className="mt-4 text-lg text-white/90">
              Cuida y sigue el crecimiento de tu árbol
            </p>

            {!session && (
              <div className="mt-6">
                <Link href="/registro">
                  <Button size="lg" className="bg-[color:var(--color-primary)] hover:bg-[color:var(--primary-700)] text-white">
                    Comienza ahora
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="hero-section relative py-12 md:py-24 px-4">
          <div className="w-full px-6 lg:px-12">
            <div className="hero-grid grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-6 items-center">
              <div className="text-center lg:text-left hero-left flex flex-col justify-center lg:pr-12 lg:pl-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Sprout className="h-4 w-4" />
                  <span>Un árbol plantado, un futuro asegurado</span>
                </div>

                <div className="mt-4">
                  <AnimatedHeading
                    text="Haz crecer tu árbol y"
                    highlight="documenta su historia"
                    className="hero-heading text-4xl md:text-5xl lg:text-6xl leading-tight text-slate-900"
                  />
                </div>

                <p className="mt-4 text-lg md:text-xl text-muted-foreground text-pretty max-w-3xl">
                  Registra, cuida y sigue el crecimiento de tus árboles plantados.
                  Comparte su evolución con fotos y aprende los mejores consejos de
                  cuidado.
                </p>

                {!session ? (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                    <Link href="/registro">
                      <Button size="lg" className="w-full sm:w-auto bg-[color:var(--primary-600)] hover:bg-[color:var(--primary-700)] text-white rounded-lg px-6 py-3 shadow-lg flex items-center gap-3">
                        <Sprout className="h-4 w-4" />
                        Comenzar Ahora
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto bg-white/80 text-slate-700 rounded-lg px-6 py-3 flex items-center gap-3"
                      >
                        <User className="h-4 w-4" />
                        Iniciar Sesión
                      </Button>
                    </Link>
                  </div>
                ) : null}
                {/* Estadísticas compactas: mini-tarjetas debajo de los botones */}
                <div className="mt-6 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Sprout className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-emerald-700">+12,540</div>
                        <div className="text-xs text-muted-foreground">Árboles plantados</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <User className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-emerald-700">8,920</div>
                        <div className="text-xs text-muted-foreground">Usuarios activos</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-emerald-700">25,600</div>
                        <div className="text-xs text-muted-foreground">Fotos compartidas</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Leaf className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-emerald-700">18.5 ton</div>
                        <div className="text-xs text-muted-foreground">CO₂ absorbido</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end">
                <div className="hero-frame hidden lg:block">
                  <div className="hero-frame-circle">
                    <img src="/img/mini-arbol.png" alt="mini-arbol" id="mini-arbol" className="hero-image" />
                  </div>

                  {/* hero-stat-card removed from right panel (moved to left) */}
                </div>
              </div>
            </div>
          </div>
          
          {/* SVG wave bottom */}
          <div className="hero-wave" aria-hidden="true">
            <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,40 C300,140 1100,-20 1440,60 L1440,120 L0,120 Z" fill="var(--background)" />
            </svg>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-background">
          <div className="container mx-auto">
            <div className="text-center space-y-4 mb-12 relative z-30">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold relative z-30">
                Todo lo que necesitas para cuidar tu árbol
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed opacity-90 mb-6">
                Herramientas simples y efectivas para documentar y mejorar el cuidado de tus árboles
              </p>
            </div>

            <div className="mt-6 md:mt-8 lg:mt-10">
              <div className="w-full mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-8 relative z-10 max-w-none px-6 lg:px-20">
                <div className="flex flex-col md:flex-row items-stretch gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  <div className="flex-1 flex items-start gap-4 py-6 px-6 bg-white rounded-lg hover:shadow-lg transition-shadow feature-card delay-0" style={{ animationDelay: '80ms', animationName: 'fadeUp', animationDuration: '700ms', animationTimingFunction: 'cubic-bezier(.2,.8,.2,1)', animationFillMode: 'both' }}>
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Sprout className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Registra</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Añade los detalles de tu árbol plantado fácilmente.</p>
                    </div>
                  </div>

                  <div className="flex-1 flex items-start gap-4 py-6 px-6 bg-white rounded-lg hover:shadow-lg transition-shadow feature-card delay-1" style={{ animationDelay: '200ms', animationName: 'fadeUp', animationDuration: '700ms', animationTimingFunction: 'cubic-bezier(.2,.8,.2,1)', animationFillMode: 'both' }}>
                    <div className="h-12 w-12 rounded-xl bg-sky-50 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Documenta</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Sube fotos y observa su evolución con el tiempo.</p>
                    </div>
                  </div>

                  <div className="flex-1 flex items-start gap-4 py-6 px-6 bg-white rounded-lg hover:shadow-lg transition-shadow feature-card delay-2" style={{ animationDelay: '320ms', animationName: 'fadeUp', animationDuration: '700ms', animationTimingFunction: 'cubic-bezier(.2,.8,.2,1)', animationFillMode: 'both' }}>
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <BarChart className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Sigue</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Monitorea su crecimiento y recibe recomendaciones.</p>
                    </div>
                  </div>

                  <div className="flex-1 flex items-start gap-4 py-6 px-6 bg-white rounded-lg hover:shadow-lg transition-shadow feature-card delay-3" style={{ animationDelay: '440ms', animationName: 'fadeUp', animationDuration: '700ms', animationTimingFunction: 'cubic-bezier(.2,.8,.2,1)', animationFillMode: 'both' }}>
                    <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Comparte</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Inspira a otros compartiendo tu impacto ambiental.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto text-center space-y-6 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">
              Comienza a cuidar tu árbol hoy
            </h2>
            <p className="text-lg text-primary-foreground/90">
              Únete a nuestra comunidad y documenta el crecimiento de tu árbol.
              Es gratis y solo toma unos minutos.
            </p>
            <Link href="/registro">
              <Button size="lg" variant="secondary" className="mt-4">
                Crear Cuenta Gratis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
