"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Droplets,
  Thermometer,
  Wind,
  Eye,
  Gauge,
  AlertCircle,
  CheckCircle,
  Cloud,
} from "lucide-react";

export default function ClimaPage() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("/api-clima");
        const data = await res.json();

        if (!data.main) {
          throw new Error(data.message || "Error en API");
        }

        setWeather(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
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
                Clima Actual de tu Zona
              </h1>
              <p className="text-lg text-blue-700 max-w-2xl mx-auto">
                Consulta las condiciones climáticas y obtén recomendaciones
                personalizadas para el cuidado óptimo de tu árbol
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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

            {!loading && weather && (
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
                        📍 {weather.name}, {weather.sys?.country}
                      </h2>
                      <div className="flex items-center justify-center gap-3">
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
