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
  Clock,
  Trash2,
} from "lucide-react";
import type { Arbol } from "@/types";

interface WeatherHistory {
  id: string;
  arbolNombre: string;
  arbolEspecie?: string;
  arbolFoto?: string;
  clima: any;
  timestamp: Date;
  timestampFormato: string;
}

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
  const [weatherHistory, setWeatherHistory] = useState<WeatherHistory[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchArboles();
      loadWeatherHistory();
    }
  }, [status]);

  const loadWeatherHistory = () => {
    try {
      const saved = localStorage.getItem("weatherHistory");
      if (saved) {
        const parsed = JSON.parse(saved);
        setWeatherHistory(
          parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })),
        );
      }
    } catch (err) {
      console.error("Error cargando historial:", err);
    }
  };

  const saveWeatherHistory = (history: WeatherHistory[]) => {
    try {
      localStorage.setItem("weatherHistory", JSON.stringify(history));
    } catch (err) {
      console.error("Error guardando historial:", err);
    }
  };

  const fetchArboles = async () => {
    try {
      const res = await fetch("/api/arboles?mode=geo");
      if (res.ok) {
        const data = await res.json();
        setArboles(data);
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

      const now = new Date();
      const timestampFormato = now.toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const newHistoryEntry: WeatherHistory = {
        id: Date.now().toString(),
        arbolNombre: arbol.nombre,
        arbolEspecie: arbol.especie,
        arbolFoto: arbol.foto_url,
        clima: data,
        timestamp: now,
        timestampFormato: timestampFormato,
      };

      const updatedHistory = [newHistoryEntry, ...weatherHistory];
      setWeatherHistory(updatedHistory);
      saveWeatherHistory(updatedHistory);
    } catch (err: any) {
      setError(err.message || "Error al obtener clima");
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleArbolChange = (arbolId: string) => {
    const arbol = arboles.find((a) => a.id === parseInt(arbolId));
    if (arbol) {
      setSelectedArbol(arbol);
      fetchWeatherForArbol(arbol);
    }
  };

  const deleteHistoryEntry = (id: string) => {
    const updatedHistory = weatherHistory.filter((item) => item.id !== id);
    setWeatherHistory(updatedHistory);
    saveWeatherHistory(updatedHistory);
  };

  const clearHistory = () => {
    setWeatherHistory([]);
    saveWeatherHistory([]);
  };

  useEffect(() => {
    if (selectedArbol && !weather && !weatherLoading) {
      fetchWeatherForArbol(selectedArbol);
    }
  }, []);

  const detectAnomalies = (currentWeather: any, history: WeatherHistory[]) => {
    const anomalies: {
      type: string;
      severity: "critical" | "warning" | "info";
      message: string;
    }[] = [];
    const currentTemp = currentWeather?.main?.temp;
    const currentHumidity = currentWeather?.main?.humidity;
    const currentWindSpeed = currentWeather?.wind?.speed;

    const recentTemps = history
      .slice(0, 5)
      .map((h) => h.clima?.main?.temp || 0);
    const avgTemp =
      recentTemps.reduce((a, b) => a + b, 0) / Math.max(recentTemps.length, 1);

    if (currentTemp > 38) {
      anomalies.push({
        type: "heat_wave",
        severity: "critical",
        message: `🔥 ¡ONDA DE CALOR EXTREMA! Temperatura de ${currentTemp}°C detectada. Riego urgente requerido.`,
      });
    } else if (currentTemp > 35 && avgTemp > 32) {
      anomalies.push({
        type: "heat_wave",
        severity: "warning",
        message: `🌡️ Onda de calor prolongada detectada. Temperatura actual: ${currentTemp}°C. Promedio reciente: ${avgTemp.toFixed(1)}°C.`,
      });
    }

    const pressure = currentWeather?.main?.pressure;
    if (currentHumidity > 80 && pressure < 1013) {
      anomalies.push({
        type: "rain_alert",
        severity: "warning",
        message: `🌧️ Alerta de lluvia: Humedad al ${currentHumidity}% y presión baja (${pressure} hPa). Lluvia probable.`,
      });
    }

    if (history.length > 0) {
      const lastWeather = history[0]?.clima?.main;
      if (lastWeather) {
        const tempDiff = Math.abs(currentTemp - lastWeather.temp);
        const humidityDiff = Math.abs(currentHumidity - lastWeather.humidity);

        if (tempDiff > 5) {
          anomalies.push({
            type: "temp_change",
            severity: "info",
            message: `📊 Cambio significativo de temperatura: ${tempDiff.toFixed(1)}°C desde la última consulta. (${lastWeather.temp?.toFixed(1)}°C → ${currentTemp?.toFixed(1)}°C)`,
          });
        }

        if (humidityDiff > 20) {
          anomalies.push({
            type: "humidity_change",
            severity: "info",
            message: `💨 Cambio importante en humedad: ${humidityDiff.toFixed(0)}%. (${lastWeather.humidity}% → ${currentHumidity}%)`,
          });
        }
      }
    }

    return anomalies;
  };

  const getClimaticComparison = (history: WeatherHistory[]) => {
    if (history.length < 2) return null;

    const current = history[0]?.clima?.main;
    const previousRecords = history.slice(1, 6);

    if (!current || previousRecords.length === 0) return null;
    const avgHistoricTemp =
      previousRecords.reduce((sum, h) => sum + (h.clima?.main?.temp || 0), 0) /
      previousRecords.length;
    const avgHistoricHumidity =
      previousRecords.reduce(
        (sum, h) => sum + (h.clima?.main?.humidity || 0),
        0,
      ) / previousRecords.length;

    const tempDiffFromAvg = current.temp - avgHistoricTemp;
    const humidityDiffFromAvg = current.humidity - avgHistoricHumidity;

    return {
      avgHistoricTemp: avgHistoricTemp.toFixed(1),
      avgHistoricHumidity: avgHistoricHumidity.toFixed(0),
      tempDiff: tempDiffFromAvg.toFixed(1),
      humidityDiff: humidityDiffFromAvg.toFixed(0),
      samplesCount: previousRecords.length,
    };
  };

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
                {/* Alertas Climáticas Automáticas */}
                {detectAnomalies(weather, weatherHistory).length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <AlertCircle className="h-7 w-7 text-red-600" />
                      🚨 Alertas Climáticas Automáticas
                    </h2>
                    {detectAnomalies(weather, weatherHistory).map(
                      (alert, index) => (
                        <Card
                          key={index}
                          className={`border-2 ${
                            alert.severity === "critical"
                              ? "border-red-500 bg-red-50"
                              : alert.severity === "warning"
                                ? "border-yellow-500 bg-yellow-50"
                                : "border-blue-500 bg-blue-50"
                          }`}
                        >
                          <CardContent className="pt-4">
                            <p
                              className={`font-semibold ${
                                alert.severity === "critical"
                                  ? "text-red-700"
                                  : alert.severity === "warning"
                                    ? "text-yellow-700"
                                    : "text-blue-700"
                              }`}
                            >
                              {alert.message}
                            </p>
                          </CardContent>
                        </Card>
                      ),
                    )}
                  </div>
                )}

                {/* Weather Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Current Weather Description with Tree Image */}
                <Card className="bg-white border-2 border-blue-200 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedArbol?.foto_url && (
                      <div className="md:col-span-1 relative h-64 md:h-auto">
                        <img
                          src={selectedArbol.foto_url}
                          alt={selectedArbol.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=400&fit=crop";
                          }}
                        />
                      </div>
                    )}
                    <CardContent
                      className={`pt-6 ${selectedArbol?.foto_url ? "md:col-span-2" : "md:col-span-3"}`}
                    >
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">
                            🌳 {selectedArbol.nombre}
                          </h2>
                          <p className="text-sm text-gray-600 mt-1">
                            📍 {weather.name}, {weather.sys?.country}
                          </p>
                          {selectedArbol.especie && (
                            <p className="text-sm text-gray-500">
                              Especie: {selectedArbol.especie}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-blue-600">
                            <Clock className="h-5 w-5" />
                            <span className="text-sm font-medium">
                              Consulta realizada a las{" "}
                              {new Date().toLocaleTimeString("es-ES")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-start gap-3 mt-4">
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
                  </div>
                </Card>

                {/* Comparación Climática Histórica */}
                {getClimaticComparison(weatherHistory) && (
                  <Card className="bg-white border-2 border-indigo-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        📊 Comparación: Clima Actual vs Histórico
                      </h3>
                      <p className="text-indigo-200 text-sm mt-1">
                        Basado en las últimas{" "}
                        {getClimaticComparison(weatherHistory)?.samplesCount}{" "}
                        consultas registradas
                      </p>
                    </div>

                    <CardContent className="pt-6 space-y-6">
                      {/* Temperatura */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🌡️</span>
                            <span className="font-bold text-gray-800">
                              Temperatura
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${
                              parseFloat(
                                getClimaticComparison(weatherHistory)
                                  ?.tempDiff || "0",
                              ) > 3
                                ? "bg-red-100 text-red-700"
                                : parseFloat(
                                      getClimaticComparison(weatherHistory)
                                        ?.tempDiff || "0",
                                    ) < -3
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {parseFloat(
                              getClimaticComparison(weatherHistory)?.tempDiff ||
                                "0",
                            ) > 0
                              ? "+"
                              : ""}
                            {getClimaticComparison(weatherHistory)?.tempDiff}°C
                            vs promedio
                          </span>
                        </div>

                        {/* Barra visual */}
                        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                          {/* Promedio histórico - barra de fondo */}
                          <div className="absolute inset-0 flex items-center px-3">
                            <div
                              className="h-4 bg-indigo-200 rounded-full transition-all"
                              style={{
                                width: `${Math.min((parseFloat(getClimaticComparison(weatherHistory)?.avgHistoricTemp || "0") / 50) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          {/* Valor actual - barra encima */}
                          <div className="absolute inset-0 flex items-center px-3">
                            <div
                              className={`h-6 rounded-full transition-all ${
                                weather.main?.temp > 38
                                  ? "bg-red-500"
                                  : weather.main?.temp > 32
                                    ? "bg-orange-400"
                                    : "bg-indigo-500"
                              }`}
                              style={{
                                width: `${Math.min((weather.main?.temp / 50) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                            <p className="text-xs text-indigo-600 font-medium mb-1">
                              📍 Temperatura Actual
                            </p>
                            <p className="text-2xl font-bold text-indigo-800">
                              {weather.main?.temp?.toFixed(1)}°C
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {weather.main?.temp > 38
                                ? "🔥 Extremadamente caliente"
                                : weather.main?.temp > 32
                                  ? "☀️ Muy caliente"
                                  : weather.main?.temp > 20
                                    ? "🌤️ Templado"
                                    : "❄️ Fresco"}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-600 font-medium mb-1">
                              📈 Promedio Histórico
                            </p>
                            <p className="text-2xl font-bold text-gray-700">
                              {
                                getClimaticComparison(weatherHistory)
                                  ?.avgHistoricTemp
                              }
                              °C
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Últimas{" "}
                              {
                                getClimaticComparison(weatherHistory)
                                  ?.samplesCount
                              }{" "}
                              consultas
                            </p>
                          </div>
                        </div>

                        <div
                          className={`rounded-lg p-3 text-sm font-medium ${
                            parseFloat(
                              getClimaticComparison(weatherHistory)?.tempDiff ||
                                "0",
                            ) > 3
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : parseFloat(
                                    getClimaticComparison(weatherHistory)
                                      ?.tempDiff || "0",
                                  ) < -3
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-green-50 text-green-700 border border-green-200"
                          }`}
                        >
                          {parseFloat(
                            getClimaticComparison(weatherHistory)?.tempDiff ||
                              "0",
                          ) > 3
                            ? `🔺 La temperatura subió ${getClimaticComparison(weatherHistory)?.tempDiff}°C por encima del promedio. Tu árbol puede estar bajo estrés térmico.`
                            : parseFloat(
                                  getClimaticComparison(weatherHistory)
                                    ?.tempDiff || "0",
                                ) < -3
                              ? `🔻 La temperatura bajó ${Math.abs(parseFloat(getClimaticComparison(weatherHistory)?.tempDiff || "0"))}°C por debajo del promedio. Condiciones más frescas de lo usual.`
                              : `✅ La temperatura está dentro del rango normal histórico. Sin cambios significativos.`}
                        </div>
                      </div>

                      <div className="border-t border-gray-100" />

                      {/* Humedad */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">💧</span>
                            <span className="font-bold text-gray-800">
                              Humedad
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${
                              parseFloat(
                                getClimaticComparison(weatherHistory)
                                  ?.humidityDiff || "0",
                              ) < -15
                                ? "bg-red-100 text-red-700"
                                : parseFloat(
                                      getClimaticComparison(weatherHistory)
                                        ?.humidityDiff || "0",
                                    ) > 15
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {parseFloat(
                              getClimaticComparison(weatherHistory)
                                ?.humidityDiff || "0",
                            ) > 0
                              ? "+"
                              : ""}
                            {
                              getClimaticComparison(weatherHistory)
                                ?.humidityDiff
                            }
                            % vs promedio
                          </span>
                        </div>

                        {/* Barra visual humedad */}
                        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                          <div className="absolute inset-0 flex items-center px-3">
                            <div
                              className="h-4 bg-blue-200 rounded-full transition-all"
                              style={{
                                width: `${Math.min(parseFloat(getClimaticComparison(weatherHistory)?.avgHistoricHumidity || "0"), 100)}%`,
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 flex items-center px-3">
                            <div
                              className={`h-6 rounded-full transition-all ${
                                weather.main?.humidity < 30
                                  ? "bg-red-500"
                                  : weather.main?.humidity < 50
                                    ? "bg-yellow-400"
                                    : "bg-blue-500"
                              }`}
                              style={{
                                width: `${Math.min(weather.main?.humidity, 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <p className="text-xs text-blue-600 font-medium mb-1">
                              📍 Humedad Actual
                            </p>
                            <p className="text-2xl font-bold text-blue-800">
                              {weather.main?.humidity}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {weather.main?.humidity < 30
                                ? "🚨 Muy seca - riesgo alto"
                                : weather.main?.humidity < 50
                                  ? "⚠️ Baja - monitorear"
                                  : weather.main?.humidity < 70
                                    ? "✅ Óptima"
                                    : "💦 Alta - posible lluvia"}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-600 font-medium mb-1">
                              📈 Promedio Histórico
                            </p>
                            <p className="text-2xl font-bold text-gray-700">
                              {
                                getClimaticComparison(weatherHistory)
                                  ?.avgHistoricHumidity
                              }
                              %
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Últimas{" "}
                              {
                                getClimaticComparison(weatherHistory)
                                  ?.samplesCount
                              }{" "}
                              consultas
                            </p>
                          </div>
                        </div>

                        <div
                          className={`rounded-lg p-3 text-sm font-medium ${
                            parseFloat(
                              getClimaticComparison(weatherHistory)
                                ?.humidityDiff || "0",
                            ) < -15
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : parseFloat(
                                    getClimaticComparison(weatherHistory)
                                      ?.humidityDiff || "0",
                                  ) > 15
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-green-50 text-green-700 border border-green-200"
                          }`}
                        >
                          {parseFloat(
                            getClimaticComparison(weatherHistory)
                              ?.humidityDiff || "0",
                          ) < -15
                            ? `🔺 La humedad bajó ${Math.abs(parseFloat(getClimaticComparison(weatherHistory)?.humidityDiff || "0"))}% respecto al promedio. Mayor riesgo de estrés hídrico en tu árbol.`
                            : parseFloat(
                                  getClimaticComparison(weatherHistory)
                                    ?.humidityDiff || "0",
                                ) > 15
                              ? `🔻 La humedad subió ${getClimaticComparison(weatherHistory)?.humidityDiff}% respecto al promedio. Condiciones más húmedas de lo habitual.`
                              : `✅ La humedad está dentro del rango normal histórico. Sin cambios significativos.`}
                        </div>
                      </div>

                      {/* Resumen general */}
                      <div className="border-t border-gray-100 pt-4">
                        <div
                          className={`rounded-xl p-4 border-2 ${
                            parseFloat(
                              getClimaticComparison(weatherHistory)?.tempDiff ||
                                "0",
                            ) > 3 ||
                            parseFloat(
                              getClimaticComparison(weatherHistory)
                                ?.humidityDiff || "0",
                            ) < -15
                              ? "bg-red-50 border-red-300"
                              : parseFloat(
                                    getClimaticComparison(weatherHistory)
                                      ?.tempDiff || "0",
                                  ) > 1 ||
                                  parseFloat(
                                    getClimaticComparison(weatherHistory)
                                      ?.humidityDiff || "0",
                                  ) < -5
                                ? "bg-yellow-50 border-yellow-300"
                                : "bg-emerald-50 border-emerald-300"
                          }`}
                        >
                          <p className="font-bold text-gray-800 mb-1">
                            🔍 Diagnóstico General
                          </p>
                          <p
                            className={`text-sm ${
                              parseFloat(
                                getClimaticComparison(weatherHistory)
                                  ?.tempDiff || "0",
                              ) > 3 ||
                              parseFloat(
                                getClimaticComparison(weatherHistory)
                                  ?.humidityDiff || "0",
                              ) < -15
                                ? "text-red-700"
                                : parseFloat(
                                      getClimaticComparison(weatherHistory)
                                        ?.tempDiff || "0",
                                    ) > 1 ||
                                    parseFloat(
                                      getClimaticComparison(weatherHistory)
                                        ?.humidityDiff || "0",
                                    ) < -5
                                  ? "text-yellow-700"
                                  : "text-emerald-700"
                            }`}
                          >
                            {parseFloat(
                              getClimaticComparison(weatherHistory)?.tempDiff ||
                                "0",
                            ) > 3 ||
                            parseFloat(
                              getClimaticComparison(weatherHistory)
                                ?.humidityDiff || "0",
                            ) < -15
                              ? "🚨 Las condiciones actuales son significativamente peores que el promedio histórico. Tu árbol necesita atención especial."
                              : parseFloat(
                                    getClimaticComparison(weatherHistory)
                                      ?.tempDiff || "0",
                                  ) > 1 ||
                                  parseFloat(
                                    getClimaticComparison(weatherHistory)
                                      ?.humidityDiff || "0",
                                  ) < -5
                                ? "⚠️ Las condiciones han cambiado moderadamente respecto al promedio. Mantén un monitoreo regular."
                                : "✅ Las condiciones actuales son similares al promedio histórico. Todo marcha con normalidad."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ============================================ */}
                {/* REGLAS CLIMÁTICAS - PRONÓSTICO DEL ÁRBOL    */}
                {/* ============================================ */}
                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                          🌿 Reglas Climáticas
                        </h3>
                        <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full font-medium">
                          Análisis automático
                        </span>
                      </div>

                      {/* Regla 1: Humedad Baja → Estrés Hídrico */}
                      <div
                        className={`rounded-lg p-4 border-2 ${
                          weather.main?.humidity < 30
                            ? "bg-red-50 border-red-400"
                            : weather.main?.humidity < 50
                              ? "bg-yellow-50 border-yellow-400"
                              : "bg-green-50 border-green-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">💧</span>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-gray-800">
                              Regla 1: Humedad → Estrés Hídrico
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Humedad actual:{" "}
                              <strong>{weather.main?.humidity}%</strong>
                            </p>
                            <p
                              className={`text-sm font-semibold mt-2 ${
                                weather.main?.humidity < 30
                                  ? "text-red-700"
                                  : weather.main?.humidity < 50
                                    ? "text-yellow-700"
                                    : "text-green-700"
                              }`}
                            >
                              {weather.main?.humidity < 30
                                ? "🚨 CRÍTICO: Estrés hídrico severo. Tu árbol necesita riego urgente ahora."
                                : weather.main?.humidity < 50
                                  ? "⚠️ ALERTA: Estrés hídrico moderado. Aumenta la frecuencia de riego."
                                  : "✅ ÓPTIMO: Humedad adecuada. Mantén el riego habitual."}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Regla 2: Calor Alto → Deshidratación */}
                      <div
                        className={`rounded-lg p-4 border-2 ${
                          weather.main?.temp > 38
                            ? "bg-red-50 border-red-400"
                            : weather.main?.temp > 32
                              ? "bg-orange-50 border-orange-400"
                              : "bg-green-50 border-green-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🌡️</span>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-gray-800">
                              Regla 2: Temperatura → Riesgo de Deshidratación
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Temperatura actual:{" "}
                              <strong>
                                {weather.main?.temp?.toFixed(1)}°C
                              </strong>
                            </p>
                            <p
                              className={`text-sm font-semibold mt-2 ${
                                weather.main?.temp > 38
                                  ? "text-red-700"
                                  : weather.main?.temp > 32
                                    ? "text-orange-700"
                                    : "text-green-700"
                              }`}
                            >
                              {weather.main?.temp > 38
                                ? "🚨 CRÍTICO: Riesgo extremo de deshidratación. Riega inmediatamente y da sombra."
                                : weather.main?.temp > 32
                                  ? "⚠️ ALERTA: Riesgo moderado de deshidratación. Riega en la mañana y al atardecer."
                                  : "✅ ÓPTIMO: Temperatura dentro del rango seguro para tu árbol."}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pronóstico Final Combinado */}
                      <div
                        className={`rounded-lg p-4 border-2 ${
                          weather.main?.humidity < 30 || weather.main?.temp > 38
                            ? "bg-red-100 border-red-500"
                            : weather.main?.humidity < 50 ||
                                weather.main?.temp > 32
                              ? "bg-yellow-100 border-yellow-500"
                              : "bg-emerald-100 border-emerald-400"
                        }`}
                      >
                        <p className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                          <span>🌳</span> Pronóstico para{" "}
                          <span className="text-emerald-700">
                            {selectedArbol.nombre}
                          </span>
                        </p>
                        <p
                          className={`text-sm font-semibold ${
                            weather.main?.humidity < 30 ||
                            weather.main?.temp > 38
                              ? "text-red-700"
                              : weather.main?.humidity < 50 ||
                                  weather.main?.temp > 32
                                ? "text-yellow-700"
                                : "text-emerald-700"
                          }`}
                        >
                          {weather.main?.humidity < 30 ||
                          weather.main?.temp > 38
                            ? "🚨 ESTADO CRÍTICO: Tu árbol está en alto riesgo. Requiere atención inmediata: riego urgente, sombra y monitoreo constante."
                            : weather.main?.humidity < 50 ||
                                weather.main?.temp > 32
                              ? "⚠️ ESTADO DE ALERTA: Tu árbol necesita cuidados adicionales. Aumenta el riego y revisa el suelo diariamente."
                              : "✅ ESTADO SALUDABLE: Las condiciones climáticas son favorables. Mantén tu rutina de cuidado habitual."}
                        </p>
                      </div>
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

        {/* Weather History Section */}
        <section className="py-12 px-4 bg-gray-50 border-t">
          <div className="container mx-auto max-w-4xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  📋 Historial de Consultas Climáticas
                </h2>
                {weatherHistory.length > 0 && (
                  <Button
                    onClick={clearHistory}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar historial
                  </Button>
                )}
              </div>

              {weatherHistory.length === 0 ? (
                <Card className="border-gray-200 bg-white">
                  <CardContent className="pt-6 text-center">
                    <Cloud className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">
                      No hay consultas climáticas registradas. ¡Realiza tu
                      primera consulta!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {weatherHistory.map((entry) => (
                    <Card
                      key={entry.id}
                      className="border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          {entry.arbolFoto && (
                            <div className="md:w-20 md:h-20 w-full h-32">
                              <img
                                src={entry.arbolFoto}
                                alt={entry.arbolNombre}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=80&h=80&fit=crop";
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                  🌳 {entry.arbolNombre}
                                </h3>
                                {entry.arbolEspecie && (
                                  <p className="text-xs text-gray-500">
                                    {entry.arbolEspecie}
                                  </p>
                                )}
                              </div>
                              <Button
                                onClick={() => deleteHistoryEntry(entry.id)}
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <Clock className="h-4 w-4" />
                              <span>{entry.timestampFormato}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                              <div className="bg-orange-50 rounded p-2">
                                <p className="text-xs text-gray-600">
                                  Temperatura
                                </p>
                                <p className="text-sm font-bold text-orange-600">
                                  {entry.clima.main?.temp?.toFixed(1)}°C
                                </p>
                              </div>
                              <div className="bg-blue-50 rounded p-2">
                                <p className="text-xs text-gray-600">Humedad</p>
                                <p className="text-sm font-bold text-blue-600">
                                  {entry.clima.main?.humidity}%
                                </p>
                              </div>
                              <div className="bg-teal-50 rounded p-2">
                                <p className="text-xs text-gray-600">Viento</p>
                                <p className="text-sm font-bold text-teal-600">
                                  {entry.clima.wind?.speed?.toFixed(1)} m/s
                                </p>
                              </div>
                              <div className="bg-purple-50 rounded p-2">
                                <p className="text-xs text-gray-600">Presión</p>
                                <p className="text-sm font-bold text-purple-600">
                                  {entry.clima.main?.pressure} hPa
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Cloud className="h-4 w-4 text-gray-400" />
                              <span className="capitalize">
                                {entry.clima.weather?.[0]?.description}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
