"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wind,
  Droplets,
  Leaf,
  Shield,
  Home,
  TreePine,
  Sun,
  Music,
  ArrowRight,
} from "lucide-react";

const beneficios = [
  {
    icon: Wind,
    titulo: "Producción de oxígeno",
    descripcion:
      "Durante la fotosíntesis, los árboles liberan oxígeno que es esencial para la vida.",
    color: "bg-green-500",
  },
  {
    icon: Leaf,
    titulo: "Captura de carbono",
    descripcion:
      "Capturan dióxido de carbono y lo almacenan en su biomasa: hojas, corteza y raíces.",
    color: "bg-emerald-500",
  },
  {
    icon: Sun,
    titulo: "Filtración del aire",
    descripcion:
      "Filtran las partículas contaminantes en el aire, ayudando a mejorar su calidad.",
    color: "bg-yellow-500",
  },
  {
    icon: Shield,
    titulo: "Sombra y protección",
    descripcion:
      "Sus copas brindan sombra, lo que ayuda a lidiar con el calor y previene efectos de rayos UV.",
    color: "bg-blue-500",
  },
  {
    icon: Droplets,
    titulo: "Transpiración",
    descripcion:
      "Al transpirar aportan humedad al ambiente, mejorando las condiciones climáticas.",
    color: "bg-cyan-500",
  },
  {
    icon: Home,
    titulo: "Refugio y alimento",
    descripcion:
      "Proporcionan refugio y alimento a la vida silvestre: aves, insectos y mamíferos.",
    color: "bg-amber-600",
  },
  {
    icon: Music,
    titulo: "Amortiguamiento de ruido",
    descripcion:
      "En grandes masas ayudan a amortiguar el ruido, creando espacios más tranquilos.",
    color: "bg-purple-500",
  },
  {
    icon: TreePine,
    titulo: "Retención de agua",
    descripcion:
      "La interacción de sus raíces con el suelo ayuda a retener agua de lluvia en acuíferos.",
    color: "bg-teal-500",
  },
];

export default function BeneficiosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-b from-green-50 to-green-100">
          <div className="container mx-auto text-center space-y-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-200 text-green-800 text-sm font-medium">
              <Leaf className="h-4 w-4" />
              <span>Impacto Ambiental Positivo</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-green-900 text-balance">
              Beneficios que brindan los árboles
            </h1>

            <p className="text-lg md:text-xl text-green-800 text-pretty max-w-3xl mx-auto">
              Todo bosque empieza con un árbol. Estas plantas de tallo leñoso,
              en interacción con el resto de organismos en el ecosistema,
              aportan una serie de servicios ambientales esenciales para la vida
              en nuestro planeta.
            </p>
          </div>
        </section>

        {/* Galería de imágenes destacadas */}
        <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Infografías Educativas
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Conoce todos los beneficios de los árboles en nuestras
                infografías ilustradas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 ">
              <div className="group">
                <div className="relative w-full aspect-[12/11] md:aspect-[16/15] overflow-hidden rounded-lg shadow-xl">
                  <Image
                    src="/img/arboles_2.jpg"
                    alt="Beneficios Ambientales de los Árboles"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    priority
                  />
                </div>
                <h3 className="text-xl font-bold text-green-900 mt-4 text-center">
                  Beneficios Ambientales
                </h3>
              </div>

              <div className="group">
                <div className="relative w-full aspect-[6/5] md:aspect-[16/15] overflow-hidden rounded-lg shadow-xl">
                  <Image
                    src="/img/beneficios_imagen2.jpg"
                    alt="Beneficios del Ecosistema"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    priority
                  />
                </div>
                <h3 className="text-xl font-bold text-green-900 mt-4 text-center">
                  Beneficios del Ecosistema
                </h3>
              </div>
            </div>
          </div>
        </section>
        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Servicios Ambientales
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Los árboles ofrecen múltiples beneficios que mejoran nuestro
                entorno y calidad de vida
              </p>
            </div>

            {/* Grid de beneficios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {beneficios.map((beneficio, index) => {
                const IconComponent = beneficio.icon;
                return (
                  <Card
                    key={index}
                    className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <CardContent className="pt-8">
                      <div
                        className={`${beneficio.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4 mx-auto`}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 text-center mb-3">
                        {beneficio.titulo}
                      </h3>
                      <p className="text-gray-600 text-center text-sm leading-relaxed">
                        {beneficio.descripcion}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4 bg-green-600 text-white">
          <div className="container mx-auto max-w-4xl text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">
              ¿Listo para hacer la diferencia?
            </h2>
            <p className="text-xl text-green-50 max-w-2xl mx-auto">
              Únete a nuestra comunidad y comienza a plantar árboles. Cada árbol
              cuenta, cada acción importa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registro">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-green-600 hover:bg-green-50"
                >
                  Comenzar Ahora
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white text-white hover:bg-green-700"
                >
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
