import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Leaf, MapPin, Camera, Calendar, BookOpen, Sprout, User, BarChart, Heart } from "lucide-react";
import AnimatedHeading from "@/components/animated-heading";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section: imagen de fondo con texto superpuesto */}
        <section className="relative h-[48vh] md:h-[58vh] flex items-center">
          <div className="absolute inset-0 z-0">
            <img
              src="/img/EcoDataIA (2).png"
              alt="EcoData IA - árbol"
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 50%" }}
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

            <div className="mt-6">
              <Link href="/registro">
                <Button size="lg" className="bg-green-600/90 hover:bg-green-700">
                  Comienza ahora
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="hero-section relative py-12 md:py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="hero-grid grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-center">
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

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <Link href="/registro">
                    <Button size="lg" className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-6 py-3 shadow-lg flex items-center gap-3">
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
              </div>

              <div className="relative flex justify-center lg:justify-end">
                <div className="hero-frame hidden lg:block">
                  <div className="hero-frame-circle">
                    <img src="/img/mini-arbol.png" alt="mini-arbol" id="mini-arbol" className="hero-image" />
                  </div>

                  <div className="hero-stat-card">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-emerald-50 p-2 flex items-center justify-center">
                        <Sprout className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Creciendo juntos</div>
                        <div className="text-base font-semibold text-emerald-700">+12,540 árboles</div>
                        <div className="text-xs text-muted-foreground">plantados por la comunidad</div>
                      </div>
                    </div>
                  </div>
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
            <div className="text-center space-y-4 mb-2">
                <h2 className="text-3xl md:text-4xl font-bold relative z-30">
                Todo lo que necesitas para cuidar tu árbol
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Herramientas simples y efectivas para documentar y mejorar el
                cuidado de tus árboles
              </p>
            </div>

            <div className="-mt-12 md:-mt-16 lg:-mt-20">
              <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md p-3 md:p-4 relative z-10">
                <div className="flex flex-col md:flex-row items-stretch divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  <div className="flex-1 flex items-start gap-4 py-4 px-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Sprout className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Registra</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Añade los detalles de tu árbol plantado fácilmente.</p>
                    </div>
                  </div>

                  <div className="flex-1 flex items-start gap-4 py-4 px-4">
                    <div className="h-12 w-12 rounded-xl bg-sky-50 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Documenta</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Sube fotos y observa su evolución con el tiempo.</p>
                    </div>
                  </div>

                  <div className="flex-1 flex items-start gap-4 py-4 px-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <BarChart className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Sigue</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Monitorea su crecimiento y recibe recomendaciones.</p>
                    </div>
                  </div>

                  <div className="flex-1 flex items-start gap-4 py-4 px-4">
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
