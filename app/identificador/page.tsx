import { SpeciesIdentifier } from "@/components/species-identifier";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function IdentificadorPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2 mb-8">
            <h1 className="text-4xl font-bold">Identificador de Especies</h1>
            <p className="text-lg text-muted-foreground">
              Usa la IA para identificar especies de árboles. Simplemente toma una foto o sube una imagen.
            </p>
          </div>
          <SpeciesIdentifier />
        </div>
      </main>
      <Footer />
    </div>
  );
}
