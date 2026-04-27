import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Leaf, MapPin, Camera, Calendar, BookOpen, Sprout } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section: imagen de fondo con texto superpuesto */}
        <section className="relative h-[70vh] md:h-[80vh] flex items-center">
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

        <section className="relative py-20 md:py-32 px-4 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container mx-auto text-center space-y-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sprout className="h-4 w-4" />
              <span>Un árbol plantado, un futuro asegurado</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-balance">
              Haz crecer tu árbol y{" "}
              <span className="text-primary">documenta su historia</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Registra, cuida y sigue el crecimiento de tus árboles plantados.
              Comparte su evolución con fotos y aprende los mejores consejos de
              cuidado.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/registro">
                <Button size="lg" className="w-full sm:w-auto">
                  Comenzar Ahora
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent"
                >
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-background">
          <div className="container mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Todo lo que necesitas para cuidar tu árbol
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Herramientas simples y efectivas para documentar y mejorar el
                cuidado de tus árboles
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <img
                      src="/img/logo_mapa.png"
                      width={60}
                      height={60}
                      className="rounded"
                    />
                  </div>
                  <h3 className="text-xl font-semibold">Ubicación en Mapa</h3>
                  <p className="text-muted-foreground">
                    Marca la ubicación exacta de tu árbol en un mapa interactivo
                    y guarda sus coordenadas.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 space-y-4">
                  <img
                    src="/img/logo_camara.webp"
                    width={60}
                    height={60}
                    className="rounded"
                  />
                  <h3 className="text-xl font-semibold">Galería de Fotos</h3>
                  <p className="text-muted-foreground">
                    Sube fotos del crecimiento de tu árbol y crea una línea de
                    tiempo visual de su evolución.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 space-y-4">
                  <img
                    src="/img/calendario.jpg"
                    width={60}
                    height={60}
                    className="rounded"
                  />
                  <h3 className="text-xl font-semibold">
                    Calendario de Seguimiento
                  </h3>
                  <p className="text-muted-foreground">
                    Visualiza todos tus seguimientos en un calendario y mantén
                    un registro organizado.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 space-y-4">
                  <img
                    src="/img/logo_register.png"
                    width={60}
                    height={60}
                    className="rounded"
                  />
                  <h3 className="text-xl font-semibold">Registro Detallado</h3>
                  <p className="text-muted-foreground">
                    Documenta altura, salud y notas importantes sobre el
                    desarrollo de tu árbol.
                  </p>
                </CardContent>
              </Card>
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
