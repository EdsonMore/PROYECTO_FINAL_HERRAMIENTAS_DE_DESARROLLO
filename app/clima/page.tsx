"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Droplets,
  Thermometer,
  Wind,
  Eye,
  Gauge,
  AlertCircle,
  CheckCircle,
  Cloud,
  MapPin,
  Loader2,
} from "lucide-react";
import type { Arbol } from "@/types";

export default function ClimaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [arboles, setArboles] = useState<Arbol[]>([]);
  const [selectedArbol, setSelectedArbol] = useState<Arbol | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState("");
  const [arbolesLoading, setArbolesLoading] = useState(true);

  // Verificar autenticación
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Cargar árboles del usuario
  useEffect(() => {
    if (status === "authenticated") {
      fetchArboles();
    }
  }, [status]);

  const fetchArboles = async () => {
    try {
      const res = await fetch("/api/arboles?mode=geo");
      if (res.ok) {
        const data = await res.json();
        setArboles(data);
        // Seleccionar el primer árbol automáticamente
        if (data.length > 0) {
          setSelectedArbol(data[0]);
        }
      }
    } catch (error) {
      console.error("Error al cargar árboles:", error);
    } finally {
      setArbolesLoading(false);
    }
  };

  // Obtener clima para ubicación específica
  const fetchWeatherForArbol = async (arbol: Arbol) => {
    setWeatherLoading(true);
    setError("");
    setWeather(null);

    try {
      const lat = +arbol.latitud;
      const lon = +arbol.longitud;
      const res = await fetch(`/api-clima?lat=${lat}&lon=${lon}`);
      const data = await res.json();

      if (!data.main) {
        throw new Error(data.message || "Error en API");
      }

      setWeather(data);
    } catch (err: any) {
      setError(err.message || "Error al obtener clima");
    } finally {
      setWeatherLoading(false);
    }
  };

  // Cuando se selecciona un árbol, obtener su clima
  const handleArbolChange = (arbolId: string) => {
    const arbol = arboles.find((a) => a.id === parseInt(arbolId));
    if (arbol) {
      setSelectedArbol(arbol);
      fetchWeatherForArbol(arbol);
    }
  };

  // Cargar clima cuando la página carga (para el primer árbol si existe)
  useEffect(() => {
    if (selectedArbol && !weather && !weatherLoading) {
      fetchWeatherForArbol(selectedArbol);
    }
  }, []);

  const getDetailedAdvice = (
    temp: number,
    humidity: number,
    windSpeed: number,
  ) => {
    const tips: string[] = [];

    if (temp > 35) {
      tips.push(
        "⚠️ Temperatura muy alta: Aumenta el riego a diario, preferiblemente en horas tempranas.",
      );
      tips.push(
        "🌳 Proporciona sombra artificial si es posible para proteger del estrés hídrico.",
      );
    } else if (temp > 30) {
      tips.push(
        "🔥 Clima caluroso: Riega abundantemente pero asegúrate que el drenaje sea adecuado.",
      );
      tips.push(
        "☀️ Mantén el mulch en la base para conservar la humedad del suelo.",
      );
    }

    if (humidity < 30) {
      tips.push(
        "💧 Humedad muy baja: Es crítico riego diario y aumentar la frecuencia de riego.",
      );
      tips.push(
        "🍃 Considera nebulizar las hojas para aumentar la humedad relativa.",
      );
    } else if (humidity < 50) {
      tips.push(
        "💧 Humedad baja: Aumenta la frecuencia de riego y verifica el suelo regularmente.",
      );
    }

    if (temp < 10) {
      tips.push(
        "❄️ Temperaturas bajas: Reduce el riego para evitar pudrición de raíces.",
      );
      tips.push("🛡️ Protege el árbol de heladas si es necesario.");
    }

    if (windSpeed > 5) {
      tips.push(
        "💨 Vientos fuertes: Puede aumentar la evaporación, ajusta el riego en consecuencia.",
      );
    }

    return tips.length > 0
      ? tips
      : ["✅ Condiciones óptimas para el cuidado de tu árbol."];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 px-4 bg-gradient-to-b from-blue-50 to-blue-100">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-200 text-blue-800 text-sm font-medium">
                <Cloud className="h-4 w-4" />
                <span>Monitoreo Climático en Tiempo Real</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-blue-900">
                Clima de tu Árbol
              </h1>
              <p className="text-lg text-blue-700 max-w-2xl mx-auto">
                Consulta las condiciones climáticas en la ubicación de tu árbol
                y obtén recomendaciones personalizadas para su cuidado óptimo
              </p>
            </div>
          </div>
        </section>

        {/* Árbol Selection Section */}
        <section className="py-8 px-4 bg-white border-b">
          <div className="container mx-auto max-w-4xl">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">
                Selecciona un Árbol
              </h2>

              {arbolesLoading ? (
                <div className="flex items-center justify-center h-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : arboles.length === 0 ? (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                      <div>
                        <p className="text-yellow-800 font-medium">
                          No tienes árboles registrados
                        </p>
                        <p className="text-sm text-yellow-700">
                          Registra tu primer árbol en "Mi Árbol" para ver el
                          clima de su ubicación.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <Select
                      value={selectedArbol?.id.toString() || ""}
                      onValueChange={handleArbolChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un árbol..." />
                      </SelectTrigger>
                      <SelectContent>
                        {arboles.map((arbol) => (
                          <SelectItem
                            key={arbol.id}
                            value={arbol.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <span>🌳 {arbol.nombre}</span>
                              {arbol.especie && (
                                <span className="text-xs text-gray-500">
                                  ({arbol.especie})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() =>
                      selectedArbol && fetchWeatherForArbol(selectedArbol)
                    }
                    disabled={!selectedArbol || weatherLoading}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    {weatherLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      <>
                        <Cloud className="mr-2 h-4 w-4" />
                        Verificar Clima
                      </>
                    )}
                  </Button>
                </div>
              )}

              {selectedArbol && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        <strong>{selectedArbol.nombre}</strong>
                        {selectedArbol.especie && ` (${selectedArbol.especie})`}
                        {" · "}
                        Lat: {(+selectedArbol.latitud).toFixed(4)}, Lon:{" "}
                        {(+selectedArbol.longitud).toFixed(4)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            {weatherLoading && (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="text-gray-600">Obteniendo datos climáticos...</p>
              </div>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50 mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <p className="text-red-700 font-medium">Error: {error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!weatherLoading && weather && selectedArbol && (
              <div className="space-y-8">
                {/* Weather Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Temperature Card */}
                  <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">
                            Temperatura
                          </p>
                          <p className="text-3xl font-bold text-orange-600 mt-2">
                            {weather.main?.temp?.toFixed(1)}°C
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Sensación térmica:{" "}
                            {weather.main?.feels_like?.toFixed(1)}°C
                          </p>
                        </div>
                        <Thermometer className="h-12 w-12 text-orange-400 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Humidity Card */}
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">
                            Humedad
                          </p>
                          <p className="text-3xl font-bold text-blue-600 mt-2">
                            {weather.main?.humidity}%
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Nivel de precipitación
                          </p>
                        </div>
                        <Droplets className="h-12 w-12 text-blue-400 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Wind Speed Card */}
                  <Card className="bg-gradient-to-br from-teal-50 to-green-50 border-teal-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">
                            Velocidad del Viento
                          </p>
                          <p className="text-3xl font-bold text-teal-600 mt-2">
                            {weather.wind?.speed?.toFixed(1)} m/s
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Ráfagas: {weather.wind?.gust?.toFixed(1) || "N/A"}{" "}
                            m/s
                          </p>
                        </div>
                        <Wind className="h-12 w-12 text-teal-400 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pressure Card */}
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">
                            Presión
                          </p>
                          <p className="text-3xl font-bold text-purple-600 mt-2">
                            {weather.main?.pressure} hPa
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Visibilidad:{" "}
                            {(weather.visibility / 1000)?.toFixed(1)} km
                          </p>
                        </div>
                        <Gauge className="h-12 w-12 text-purple-400 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Current Weather Description */}
                <Card className="bg-white border-2 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-gray-800">
                        🌳 {selectedArbol.nombre}
                      </h2>
                      <p className="text-sm text-gray-600">
                        📍 {weather.name}, {weather.sys?.country}
                      </p>
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <Cloud className="h-8 w-8 text-gray-400" />
                        <p className="text-xl text-gray-600 capitalize">
                          {weather.weather?.[0]?.description}
                        </p>
                      </div>
                      {weather.clouds && (
                        <p className="text-sm text-gray-500">
                          Nubosidad: {weather.clouds?.all}%
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations Section */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="h-7 w-7 text-green-600" />
                    Recomendaciones de Cuidado
                  </h2>

                  <div className="grid gap-3">
                    {getDetailedAdvice(
                      weather.main?.temp,
                      weather.main?.humidity,
                      weather.wind?.speed,
                    ).map((tip, index) => (
                      <Card
                        key={index}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                      >
                        <CardContent className="pt-4">
                          <p className="text-gray-700">{tip}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Care Tips Section */}
                <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-4">
                      💡 Consejos Generales de Riego
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        ✓ Riega en las horas tempranas de la mañana o al
                        atardecer
                      </li>
                      <li>
                        ✓ Verifica la humedad del suelo antes de regar
                        (profundidad 5-10 cm)
                      </li>
                      <li>
                        ✓ Usa mulch para retener la humedad y proteger las
                        raíces
                      </li>
                      <li>✓ Drena correctamente para evitar encharcamientos</li>
                      <li>
                        ✓ Observa las hojas para detectar signos de estrés
                        hídrico
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {!weatherLoading && !error && !weather && !arbolesLoading && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Cloud className="h-6 w-6 text-blue-600" />
                    <p className="text-blue-700 font-medium">
                      Selecciona un árbol y haz clic en "Verificar Clima" para
                      ver las condiciones actuales
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
