"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Gauge,
  AlertCircle,
  CheckCircle,
  Cloud,
  MapPin,
  Loader2,
  Clock,
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Leaf,
  HelpCircle,
  ShieldCheck,
  BarChart3,
  TreePine,
  Download,
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

interface WeatherPrediction {
  day: number;
  date: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  trend: "up" | "down" | "stable";
  tempChange: number;
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
  const [prediction, setPrediction] = useState<WeatherPrediction[]>([]);
  const [showPrediction, setShowPrediction] = useState(false);

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

  const getStorageKey = () => {
    return `weatherHistory_${session?.user?.email || "guest"}`;
  };

  const loadWeatherHistory = () => {
    try {
      const key = `weatherHistory_${session?.user?.email || "guest"}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setWeatherHistory(
          parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })),
        );
      } else {
        setWeatherHistory([]);
      }
    } catch (err) {
      console.error("Error cargando historial:", err);
    }
  };

  const saveWeatherHistory = (history: WeatherHistory[]) => {
    try {
      const key = `weatherHistory_${session?.user?.email || "guest"}`;
      const jsonData = JSON.stringify(history);

      // Verificar si el dato es demasiado grande (> 4MB)
      if (jsonData.length > 4 * 1024 * 1024) {
        console.warn("Historial demasiado grande, compactando...");

        // Mantener solo los últimos 15 registros
        const compactedHistory = history.slice(-15);
        const compactedJson = JSON.stringify(compactedHistory);

        // Si aún es muy grande, reducir a 10
        if (compactedJson.length > 4 * 1024 * 1024) {
          const reducedHistory = history.slice(-10);
          localStorage.setItem(key, JSON.stringify(reducedHistory));
          console.log("Historial reducido a 10 registros");
        } else {
          localStorage.setItem(key, compactedJson);
          console.log("Historial compactado a 15 registros");
        }
        return;
      }

      // Guardado normal
      localStorage.setItem(key, jsonData);
    } catch (err) {
      // Si falla por cuota, hacer una limpieza de emergencia
      if (err instanceof Error && err.name === "QuotaExceededError") {
        console.warn("QuotaExcedida, limpiando historial antiguo...");

        try {
          const key = `weatherHistory_${session?.user?.email || "guest"}`;
          // Guardar solo los últimos 5 registros
          const emergencyHistory = history.slice(-5);
          localStorage.setItem(key, JSON.stringify(emergencyHistory));
          console.log("Historial reducido a 5 registros por emergencia");
        } catch (emergencyErr) {
          // Si aún falla, eliminar completamente
          console.error(
            "No se pudo guardar ni siquiera 5 registros, eliminando historial",
          );
          localStorage.removeItem(
            `weatherHistory_${session?.user?.email || "guest"}`,
          );
        }
      } else {
        console.error("Error guardando historial:", err);
      }
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

  // 🔮 FUNCIÓN DE PREDICCIÓN CLIMÁTICA
  const generateWeatherPrediction = (
    history: WeatherHistory[],
    currentWeather: any,
  ) => {
    if (!currentWeather || history.length < 2) {
      // Si no hay suficientes datos, generar predicción basada en el clima actual
      return generateFallbackPrediction(currentWeather);
    }

    const predictions: WeatherPrediction[] = [];
    const now = new Date();

    // Calcular promedios históricos
    const recentRecords = history.slice(0, Math.min(10, history.length));
    const avgTemp =
      recentRecords.reduce((sum, h) => sum + (h.clima?.main?.temp || 0), 0) /
      recentRecords.length;
    const avgHumidity =
      recentRecords.reduce(
        (sum, h) => sum + (h.clima?.main?.humidity || 0),
        0,
      ) / recentRecords.length;
    const avgWind =
      recentRecords.reduce((sum, h) => sum + (h.clima?.wind?.speed || 0), 0) /
      recentRecords.length;

    // Detectar tendencia de temperatura
    const temps = recentRecords.map((h) => h.clima?.main?.temp || 0);
    const tempTrend = detectTrend(temps);

    const currentTemp = currentWeather.main?.temp || 0;
    const currentHumidity = currentWeather.main?.humidity || 0;
    const currentWind = currentWeather.wind?.speed || 0;

    // Generar predicción para 7 días
    for (let i = 0; i < 7; i++) {
      const day = new Date(now);
      day.setDate(day.getDate() + i + 1);

      // Simular variación diaria con patrón estacional
      const dayOfYear = day.getDate() + day.getMonth() * 30;
      const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 3;

      // Base de temperatura con tendencia y variación
      let tempBase = avgTemp + (currentTemp - avgTemp) * 0.3;

      // Agregar tendencia detectada
      const trendFactor = tempTrend * (i + 1) * 0.2;

      // Variación aleatoria controlada (±2°C)
      const randomVar = (Math.random() - 0.5) * 4;

      // Temperatura máxima y mínima del día
      const tempMax = tempBase + seasonalFactor + trendFactor + randomVar + 1.5;
      const tempMin = tempBase + seasonalFactor + trendFactor + randomVar - 1.5;

      // Humedad (varía inversamente con temperatura)
      const humidityBase = avgHumidity + (currentHumidity - avgHumidity) * 0.3;
      const humidityVar = (tempMax - avgTemp) * 0.5;
      const humidity = Math.min(
        Math.max(humidityBase - humidityVar + (Math.random() - 0.5) * 10, 20),
        90,
      );

      // Velocidad del viento
      const windBase = avgWind + (currentWind - avgWind) * 0.3;
      const windSpeed = Math.max(windBase + (Math.random() - 0.5) * 3, 0);

      // Determinar descripción del clima
      const description = getWeatherDescription(tempMax, humidity, windSpeed);

      // Calcular tendencia de temperatura día a día
      const tempChange =
        i === 0 ? tempMax - currentTemp : tempMax - predictions[i - 1].tempMax;
      const trend =
        tempChange > 0.5 ? "up" : tempChange < -0.5 ? "down" : "stable";

      predictions.push({
        day: i + 1,
        date: day.toLocaleDateString("es-ES", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        tempMax: Math.round(tempMax * 10) / 10,
        tempMin: Math.round(tempMin * 10) / 10,
        humidity: Math.round(humidity),
        windSpeed: Math.round(windSpeed * 10) / 10,
        description: description.text,
        icon: description.icon,
        trend: trend,
        tempChange: Math.round(tempChange * 10) / 10,
      });
    }

    return predictions;
  };

  // 📊 DETECTAR TENDENCIA DE TEMPERATURA
  const detectTrend = (temps: number[]): number => {
    if (temps.length < 2) return 0;

    // Calcular pendiente usando regresión lineal simple
    const n = temps.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = temps.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((a, b, i) => a + b * temps[i], 0);
    const sumX2 = indices.reduce((a, b) => a + b * b, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Normalizar la pendiente
    return slope / 5; // Factor de escala para la tendencia
  };

  // 🌦️ DESCRIPCIÓN DEL CLIMA
  const getWeatherDescription = (
    temp: number,
    humidity: number,
    wind: number,
  ) => {
    if (temp > 35 && humidity < 30) {
      return { text: "Calor extremo y seco", icon: "☀️🔥" };
    } else if (temp > 35) {
      return { text: "Ola de calor intensa", icon: "🌡️🔥" };
    } else if (temp > 30 && humidity < 40) {
      return { text: "Día caluroso y seco", icon: "☀️" };
    } else if (temp > 30) {
      return { text: "Día caluroso y húmedo", icon: "🌤️" };
    } else if (temp > 25 && humidity > 70) {
      return { text: "Clima cálido y húmedo", icon: "🌧️" };
    } else if (temp > 25) {
      return { text: "Día cálido y agradable", icon: "⛅" };
    } else if (temp > 20 && humidity > 70) {
      return { text: "Posible lluvia ligera", icon: "🌦️" };
    } else if (temp > 20) {
      return { text: "Clima templado y agradable", icon: "🌤️" };
    } else if (temp > 15) {
      return { text: "Clima fresco", icon: "☁️" };
    } else if (temp > 10) {
      return { text: "Clima frío y húmedo", icon: "❄️" };
    } else {
      return { text: "Clima muy frío", icon: "🥶" };
    }
  };

  // 🔄 PREDICCIÓN POR DEFECTO (FALLBACK)
  const generateFallbackPrediction = (currentWeather: any) => {
    const predictions: WeatherPrediction[] = [];
    const now = new Date();
    const currentTemp = currentWeather?.main?.temp || 20;
    const currentHumidity = currentWeather?.main?.humidity || 50;
    const currentWind = currentWeather?.wind?.speed || 3;

    for (let i = 0; i < 7; i++) {
      const day = new Date(now);
      day.setDate(day.getDate() + i + 1);

      // Variación senoidal para simular cambio climático
      const variation = Math.sin((i / 7) * Math.PI * 2) * 3;
      const randomVar = (Math.random() - 0.5) * 2;

      const tempMax = currentTemp + variation + randomVar + 1;
      const tempMin = currentTemp + variation + randomVar - 1;
      const humidity = Math.min(
        Math.max(currentHumidity + (Math.random() - 0.5) * 15, 20),
        90,
      );
      const windSpeed = Math.max(currentWind + (Math.random() - 0.5) * 2, 0);

      const description = getWeatherDescription(tempMax, humidity, windSpeed);

      predictions.push({
        day: i + 1,
        date: day.toLocaleDateString("es-ES", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        tempMax: Math.round(tempMax * 10) / 10,
        tempMin: Math.round(tempMin * 10) / 10,
        humidity: Math.round(humidity),
        windSpeed: Math.round(windSpeed * 10) / 10,
        description: description.text,
        icon: description.icon,
        trend: variation > 0.5 ? "up" : variation < -0.5 ? "down" : "stable",
        tempChange: Math.round(variation * 10) / 10,
      });
    }

    return predictions;
  };

  // 📈 OBTENER RESUMEN DE TENDENCIA GENERAL
  const getOverallTrend = (predictions: WeatherPrediction[]) => {
    if (predictions.length < 2) return { trend: "stable", change: 0 };

    const firstTemp = predictions[0].tempMax;
    const lastTemp = predictions[predictions.length - 1].tempMax;
    const change = lastTemp - firstTemp;

    return {
      trend: change > 1 ? "up" : change < -1 ? "down" : "stable",
      change: Math.round(change * 10) / 10,
    };
  };

  // 🎯 FUNCIÓN DE PREDICCIÓN AL HACER CLICK
  const handlePredictionClick = () => {
    if (weather && weatherHistory.length > 0) {
      const newPrediction = generateWeatherPrediction(weatherHistory, weather);
      setPrediction(newPrediction);
      setShowPrediction(true);
    } else if (weather) {
      // Si no hay historial, usar predicción fallback
      const fallbackPred = generateFallbackPrediction(weather);
      setPrediction(fallbackPred);
      setShowPrediction(true);
    } else {
      setError("Primero obtén el clima actual para generar una predicción");
    }
  };

  const fetchWeatherForArbol = async (arbol: Arbol) => {
    setWeatherLoading(true);
    setError("");
    setWeather(null);
    setShowPrediction(false);

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

      // Generar predicción automáticamente
      const newPrediction = generateWeatherPrediction(updatedHistory, data);
      setPrediction(newPrediction);
      setShowPrediction(true);
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

  const buildReportData = () => {
    const currentWeather = weather ?? {
      main: {
        temp: heroWeather.main?.temp ?? 0,
        feels_like: heroWeather.main?.feels_like ?? 0,
        humidity: heroWeather.main?.humidity ?? 0,
        pressure: heroWeather.main?.pressure ?? 0,
      },
      wind: {
        speed: heroWeather.wind?.speed ?? 0,
        gust: heroWeather.wind?.gust ?? 0,
      },
      weather: [
        { description: heroWeather.weather?.[0]?.description ?? "Sin datos" },
      ],
      clouds: { all: heroWeather.clouds?.all ?? 0 },
      name: heroWeather.name ?? selectedArbol?.nombre ?? "Árbol",
      sys: { country: heroWeather.sys?.country ?? "" },
    };

    const reportRows = weatherHistory.map((item) => ({
      fecha: item.timestampFormato,
      arbol: item.arbolNombre,
      especie: item.arbolEspecie || "Sin especie",
      temperatura: item.clima?.main?.temp?.toFixed(1) ?? "N/D",
      humedad: item.clima?.main?.humidity?.toFixed(0) ?? "N/D",
      viento: item.clima?.wind?.speed?.toFixed(1) ?? "N/D",
      descripcion: item.clima?.weather?.[0]?.description ?? "Sin datos",
    }));

    return {
      treeName: selectedArbol?.nombre || heroWeather.name || "Árbol",
      treeSpecies: selectedArbol?.especie || "Sin especie",
      currentWeather,
      prediction,
      reportRows,
    };
  };

  const exportToPdf = () => {
    const reportData = buildReportData();
    const reportWindow = window.open("", "_blank", "width=1100,height=900");

    if (!reportWindow) {
      setError("Tu navegador bloqueó la ventana de impresión del reporte.");
      return;
    }

    const predictionRows = reportData.prediction
      .map(
        (item) => `
          <tr>
            <td>${item.date}</td>
            <td>${item.description}</td>
            <td>${item.tempMax}°C</td>
            <td>${item.tempMin}°C</td>
            <td>${item.humidity}%</td>
            <td>${item.windSpeed} km/h</td>
          </tr>`,
      )
      .join("");

    const historyRows = reportData.reportRows
      .map(
        (item) => `
          <tr>
            <td>${item.fecha}</td>
            <td>${item.arbol}</td>
            <td>${item.especie}</td>
            <td>${item.temperatura}°C</td>
            <td>${item.humedad}%</td>
            <td>${item.viento} km/h</td>
            <td>${item.descripcion}</td>
          </tr>`,
      )
      .join("");

    reportWindow.document.write(`
      <html>
        <head>
          <title>Reporte climático</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1, h2 { color: #065f46; }
            .card { border: 1px solid #d1d5db; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
            th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
            th { background: #ecfdf5; }
          </style>
        </head>
        <body>
          <h1>Reporte climático detallado</h1>
          <p><strong>Árbol:</strong> ${reportData.treeName}</p>
          <p><strong>Especie:</strong> ${reportData.treeSpecies}</p>
          <p><strong>Fecha de generación:</strong> ${new Date().toLocaleString("es-ES")}</p>

          <div class="card">
            <h2>Clima actual</h2>
            <p><strong>Temperatura:</strong> ${reportData.currentWeather.main?.temp?.toFixed(1) ?? "N/D"}°C</p>
            <p><strong>Humedad:</strong> ${reportData.currentWeather.main?.humidity ?? "N/D"}%</p>
            <p><strong>Viento:</strong> ${reportData.currentWeather.wind?.speed?.toFixed(1) ?? "N/D"} km/h</p>
            <p><strong>Descripción:</strong> ${reportData.currentWeather.weather?.[0]?.description ?? "Sin datos"}</p>
          </div>

          <div class="card">
            <h2>Predicción de 7 días</h2>
            <table>
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Clima</th>
                  <th>Máx.</th>
                  <th>Mín.</th>
                  <th>Humedad</th>
                  <th>Viento</th>
                </tr>
              </thead>
              <tbody>${predictionRows}</tbody>
            </table>
          </div>

          <div class="card">
            <h2>Historial de consultas del árbol</h2>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Árbol</th>
                  <th>Especie</th>
                  <th>Temp.</th>
                  <th>Humedad</th>
                  <th>Viento</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>${historyRows}</tbody>
            </table>
          </div>
        </body>
      </html>
    `);

    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const exportToExcel = () => {
    const reportData = buildReportData();
    const rows: string[][] = [];

    rows.push(["Reporte climático detallado", ""]);
    rows.push(["Árbol", reportData.treeName]);
    rows.push(["Especie", reportData.treeSpecies]);
    rows.push(["Fecha de generación", new Date().toLocaleString("es-ES")]);
    rows.push([]);
    rows.push(["Clima actual", ""]);
    rows.push([
      "Temperatura",
      `${reportData.currentWeather.main?.temp?.toFixed(1) ?? "N/D"}°C`,
    ]);
    rows.push([
      "Humedad",
      `${reportData.currentWeather.main?.humidity ?? "N/D"}%`,
    ]);
    rows.push([
      "Viento",
      `${reportData.currentWeather.wind?.speed?.toFixed(1) ?? "N/D"} km/h`,
    ]);
    rows.push([
      "Descripción",
      reportData.currentWeather.weather?.[0]?.description ?? "Sin datos",
    ]);
    rows.push([]);
    rows.push(["Predicción de 7 días", ""]);
    rows.push(["Día", "Clima", "Máx.", "Mín.", "Humedad", "Viento"]);

    reportData.prediction.forEach((item) => {
      rows.push([
        item.date,
        item.description,
        `${item.tempMax}°C`,
        `${item.tempMin}°C`,
        `${item.humidity}%`,
        `${item.windSpeed} km/h`,
      ]);
    });

    rows.push([]);
    rows.push(["Historial de consultas", ""]);
    rows.push([
      "Fecha",
      "Árbol",
      "Especie",
      "Temperatura",
      "Humedad",
      "Viento",
      "Descripción",
    ]);

    reportData.reportRows.forEach((item) => {
      rows.push([
        item.fecha,
        item.arbol,
        item.especie,
        `${item.temperatura}°C`,
        `${item.humedad}%`,
        `${item.viento} km/h`,
        item.descripcion,
      ]);
    });

    const csvContent = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-clima-${(reportData.treeName || "arbol").toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (selectedArbol && !weather && !weatherLoading) {
      fetchWeatherForArbol(selectedArbol);
    }
  }, [selectedArbol, weather, weatherLoading]);

  // ... (resto de funciones existentes: detectAnomalies, getClimaticComparison, getDetailedAdvice)

  const detectAnomalies = (currentWeather: any, history: WeatherHistory[]) => {
    const anomalies: {
      type: string;
      severity: "critical" | "warning" | "info";
      message: string;
    }[] = [];
    const currentTemp = currentWeather?.main?.temp;
    const currentHumidity = currentWeather?.main?.humidity;

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

  const normalizeSpecies = (species?: string) => {
    if (!species) return "";

    return species
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const getSpeciesSpecificTips = (species?: string) => {
    const normalizedSpecies = normalizeSpecies(species);
    const tips: string[] = [];

    if (normalizedSpecies.includes("mango")) {
      tips.push(
        "🥭 El mango tolera calor, pero necesita un suelo húmedo sin encharcamientos.",
      );
      tips.push(
        "🌿 Mantén una capa de mulch alrededor del tronco para reducir el estrés por sequía.",
      );
    } else if (normalizedSpecies.includes("guayaba")) {
      tips.push(
        "🍈 La guayaba responde mejor a riegos frecuentes y moderados, evitando el exceso de agua.",
      );
      tips.push(
        "✂️ Una poda ligera ayuda a mantener buena circulación y menos estrés térmico.",
      );
    } else if (
      normalizedSpecies.includes("pino") ||
      normalizedSpecies.includes("cedro")
    ) {
      tips.push(
        "🌲 Estas coníferas prefieren suelos bien drenados y menos riego en épocas frías o húmedas.",
      );
      tips.push(
        "🛡️ Protege la base del árbol de vientos fuertes y cambios bruscos de temperatura.",
      );
    } else if (normalizedSpecies.includes("eucalipto")) {
      tips.push(
        "🌿 El eucalipto demanda más agua en verano, pero evita encharcamientos.",
      );
      tips.push(
        "🪵 Mantén el suelo cubierto para conservar humedad y reducir el estrés.",
      );
    } else if (
      normalizedSpecies.includes("cafe") ||
      normalizedSpecies.includes("café")
    ) {
      tips.push(
        "☕ El café necesita sombra parcial y suelo húmedo, pero con buen drenaje.",
      );
      tips.push(
        "🌧️ Revisa que no se acumule agua en la raíz durante periodos lluviosos.",
      );
    } else if (normalizedSpecies.includes("caoba")) {
      tips.push(
        "🌳 La caoba se desarrolla mejor con riegos regulares y suelo bien drenado.",
      );
      tips.push(
        "🌤️ En calor extremo, protege el tronco del sol directo excesivo.",
      );
    } else if (normalizedSpecies.includes("roble")) {
      tips.push(
        "🌳 El roble prefiere ambientes estables y evita cambios bruscos de humedad.",
      );
      tips.push(
        "🪵 Mantén el sustrato húmedo, pero no saturado, sobre todo en verano.",
      );
    } else if (
      normalizedSpecies.includes("palma") ||
      normalizedSpecies.includes("palmera")
    ) {
      tips.push(
        "🌴 La palmera tolera calor, pero necesita riego profundo y poco frecuente.",
      );
      tips.push(
        "🧴 Revisa que las hojas no se tornen por falta de agua o exceso de sol.",
      );
    } else {
      tips.push(
        "🌱 Ajusta el riego según la especie y observa el estado de las hojas.",
      );
      tips.push(
        "🧪 Mantén el suelo húmedo, pero nunca encharcado, para favorecer el desarrollo.",
      );
    }

    return tips;
  };

  const getDetailedAdvice = (
    temp: number,
    humidity: number,
    windSpeed: number,
    species?: string,
  ) => {
    const tips: string[] = [];
    const speciesTips = getSpeciesSpecificTips(species);

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
      ? [...tips, ...speciesTips]
      : ["✅ Condiciones óptimas para el cuidado de tu árbol.", ...speciesTips];
  };

  const overallTrend =
    prediction.length > 0 ? getOverallTrend(prediction) : null;

  const heroWeather = weather ?? {
    main: {
      temp: 22,
      feels_like: 23,
      humidity: 65,
      pressure: 1016,
    },
    wind: { speed: 12, gust: 14 },
    weather: [{ description: "parcialmente nublado" }],
    clouds: { all: 48 },
    name: selectedArbol?.nombre || "Tu árbol",
    sys: { country: "PE" },
  };

  const forecastPreview =
    prediction.length > 0
      ? prediction
      : [
          { day: 1, tempMax: 21, tempMin: 17, humidity: 64, windSpeed: 11 },
          { day: 2, tempMax: 23, tempMin: 18, humidity: 61, windSpeed: 10 },
          { day: 3, tempMax: 22, tempMin: 17, humidity: 63, windSpeed: 9 },
          { day: 4, tempMax: 24, tempMin: 18, humidity: 59, windSpeed: 10 },
          { day: 5, tempMax: 22, tempMin: 17, humidity: 60, windSpeed: 8 },
          { day: 6, tempMax: 25, tempMin: 19, humidity: 56, windSpeed: 10 },
          { day: 7, tempMax: 23, tempMin: 18, humidity: 58, windSpeed: 9 },
        ].map((item, index) => ({
          ...item,
          date: ["L", "M", "M", "J", "V", "S", "D"][index],
          description: "Tendencia estable",
          icon: "🌤️",
          trend: "stable" as const,
          tempChange: 0,
          windSpeed: item.windSpeed,
        }));

  const forecastLine = forecastPreview.map((item) => item.tempMax);
  const minForecast = Math.min(...forecastLine);
  const maxForecast = Math.max(...forecastLine);

  const irrigationLabel = (() => {
    const temp = heroWeather.main?.temp || 0;
    const humidity = heroWeather.main?.humidity || 0;

    if (temp >= 33 || humidity <= 35) return "Hoy";
    if (temp >= 28 || humidity <= 45) return "En 1 día";
    return "En 2 días";
  })();

  const forecastPath = forecastLine
    .map((value, index) => {
      const x =
        forecastLine.length === 1
          ? 50
          : (index / (forecastLine.length - 1)) * 100;
      const y =
        100 -
        ((value - minForecast) / Math.max(maxForecast - minForecast, 1)) * 70 -
        15;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#f5fbf1]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(236,248,232,0.78)_46%,_rgba(214,235,204,0.95))]" />
          <div
            className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent"
            aria-hidden="true"
          />
          <div className="container relative mx-auto max-w-7xl px-4 py-8 md:py-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.95fr]">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
                  <Leaf className="h-4 w-4" />
                  <span>
                    Monitoreo climático en tiempo real + Predicción 7 días
                  </span>
                </div>

                <div className="max-w-2xl space-y-4">
                  <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
                    Clima de tu <span className="text-emerald-700">Árbol</span>
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                    Consulta las condiciones climáticas actuales y obtén una
                    predicción inteligente para los próximos 7 días basada en
                    datos históricos.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/mi-arbol">
                    <Button className="h-12 rounded-xl bg-emerald-700 px-6 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-800">
                      <Leaf className="mr-2 h-4 w-4" />
                      Registrar mi primer árbol
                    </Button>
                  </Link>
                  <Link href="#como-funciona">
                    <Button
                      variant="outline"
                      className="h-12 rounded-xl border-emerald-200 bg-white/70 px-6 text-emerald-700 hover:bg-emerald-50"
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      ¿Cómo funciona?
                    </Button>
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={exportToPdf}
                      variant="outline"
                      className="h-12 rounded-xl border-emerald-200 bg-white/80 px-5 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-slate-500">
                  {arboles.length > 0
                    ? `Tienes ${arboles.length} árbol${arboles.length === 1 ? "" : "es"} registrado${arboles.length === 1 ? "" : "s"} para consultar.`
                    : "Todavía no tienes árboles registrados. Agrega el primero para ver el clima de su ubicación."}
                </p>
              </div>

              <div className="relative mx-auto w-full max-w-2xl">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-transparent p-4 shadow-[0_30px_80px_rgba(51,92,54,0.18)] backdrop-blur">
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[1.5rem] bg-white/85 p-5 shadow-sm ring-1 ring-white/80">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
                            <Cloud className="h-4 w-4" />
                            <span>Estado actual</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-5xl">🌤️</div>
                            <div>
                              <p className="text-4xl font-black tracking-tight text-slate-900">
                                {heroWeather.main?.temp?.toFixed(0)}°C
                              </p>
                              <p className="text-sm font-semibold text-emerald-700">
                                {weather?.weather?.[0]?.description ||
                                  "Parcialmente nublado"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right text-xs font-semibold text-emerald-700">
                          <div>{heroWeather.name}</div>
                          <div className="text-emerald-600/80">
                            {heroWeather.sys?.country}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-slate-500">Humedad</div>
                          <div className="mt-1 font-bold text-slate-800">
                            {heroWeather.main?.humidity}%
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-slate-500">Viento</div>
                          <div className="mt-1 font-bold text-slate-800">
                            {heroWeather.wind?.speed?.toFixed(0)} km/h
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-slate-500">Sensación</div>
                          <div className="mt-1 font-bold text-slate-800">
                            {heroWeather.main?.feels_like?.toFixed(0)}°C
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.5rem] bg-white/90 p-4 shadow-sm ring-1 ring-white/80">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Próximos 7 días
                            </p>
                            <p className="text-xs text-slate-500">
                              Tendencia climática estimada
                            </p>
                          </div>
                          <Calendar className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="rounded-2xl bg-emerald-50/80 p-3">
                          <svg
                            viewBox="0 0 100 60"
                            className="h-24 w-full overflow-visible"
                          >
                            <polyline
                              fill="none"
                              stroke="#6b8f3a"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={forecastPath}
                            />
                            {forecastLine.map((value, index) => {
                              const x =
                                forecastLine.length === 1
                                  ? 50
                                  : (index / (forecastLine.length - 1)) * 100;
                              const y =
                                100 -
                                ((value - minForecast) /
                                  Math.max(maxForecast - minForecast, 1)) *
                                  70 -
                                15;
                              return (
                                <circle
                                  key={index}
                                  cx={x}
                                  cy={y}
                                  r="1.8"
                                  fill="#7aa83a"
                                />
                              );
                            })}
                          </svg>
                          <div className="mt-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-500">
                            {forecastPreview.map((item, index) => (
                              <span key={index}>{item.date}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] bg-white/90 p-4 shadow-sm ring-1 ring-white/80">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                            <Droplets className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Riego recomendado
                            </p>
                            <p className="text-sm text-emerald-700">
                              En {irrigationLabel.toLowerCase()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-emerald-100 bg-white/80 px-4 py-8">
          <div className="container mx-auto max-w-7xl">
            <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-[#f8fcf5] p-5 md:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Leaf className="h-5 w-5" />
                    <span className="text-lg font-bold">
                      Selecciona un árbol
                    </span>
                  </div>
                  {arbolesLoading ? (
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      Cargando árboles registrados...
                    </div>
                  ) : arboles.length === 0 ? (
                    <div className="flex flex-col gap-4 rounded-[1.5rem] bg-white/90 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-5xl">
                          🌱
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900">
                            Aún no tienes árboles registrados
                          </p>
                          <p className="max-w-xl text-sm leading-6 text-slate-600">
                            Registra tu primer árbol en "Mi Árbol" para ver el
                            clima de su ubicación y recibir predicciones
                            personalizadas.
                          </p>
                        </div>
                      </div>
                      <Link href="/mi-arbol">
                        <Button className="h-11 rounded-full border border-emerald-300 bg-white px-6 text-emerald-700 hover:bg-emerald-50">
                          <TreePine className="mr-2 h-4 w-4" />
                          Ir a Mi Árbol
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-600">
                          Elige el árbol que quieres monitorear.
                        </p>
                        <Select
                          value={selectedArbol?.id.toString() || ""}
                          onValueChange={handleArbolChange}
                        >
                          <SelectTrigger className="h-12 rounded-2xl border-emerald-200 bg-white text-left shadow-sm">
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
                        className="h-12 rounded-2xl bg-emerald-700 px-6 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-800"
                      >
                        {weatherLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cargando...
                          </>
                        ) : (
                          <>
                            <Cloud className="mr-2 h-4 w-4" />
                            Verificar clima
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {selectedArbol && !arbolesLoading && (
                  <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        Ubicación seleccionada
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      <strong>{selectedArbol.nombre}</strong>
                      {selectedArbol.especie && ` (${selectedArbol.especie})`}
                    </p>
                    <p className="text-xs text-slate-500">
                      Lat: {(+selectedArbol.latitud).toFixed(4)} · Lon:{" "}
                      {(+selectedArbol.longitud).toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        <section id="como-funciona" className="bg-white px-4 py-10">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black text-slate-900 md:text-3xl">
                ¿Cómo funciona?
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Registra tu árbol",
                  text: "Agrega información básica y la ubicación de tu árbol.",
                  icon: <TreePine className="h-8 w-8 text-emerald-700" />,
                },
                {
                  step: "2",
                  title: "Consulta el clima",
                  text: "Visualiza las condiciones actuales en tiempo real.",
                  icon: <Cloud className="h-8 w-8 text-sky-600" />,
                },
                {
                  step: "3",
                  title: "Predicción 7 días",
                  text: "Recibe una predicción detallada para planificar su cuidado.",
                  icon: <Calendar className="h-8 w-8 text-emerald-700" />,
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="rounded-[1.75rem] border border-slate-100 bg-slate-50/80 p-5 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-lg font-black text-white">
                      {item.step}
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                  {index < 2 && (
                    <div className="mt-4 hidden h-px bg-emerald-100 lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-8">
          <div className="container mx-auto max-w-7xl">
            <div className="rounded-[2rem] border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-6 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                <div>
                  <div className="flex items-center gap-3 text-sky-700">
                    <ShieldCheck className="h-6 w-6" />
                    <h3 className="text-xl font-black text-slate-900">
                      Datos confiables para el mejor cuidado
                    </h3>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Usamos fuentes meteorológicas confiables y modelos avanzados
                    para brindarte información precisa y útil para tu árbol.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-sm font-semibold text-slate-700">
                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <Cloud className="mx-auto mb-2 h-6 w-6 text-sky-600" />
                    Fuentes confiables
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <BarChart3 className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
                    Predicciones precisas
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <Leaf className="mx-auto mb-2 h-6 w-6 text-emerald-700" />
                    Mejores cuidados
                  </div>
                </div>
              </div>
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
                        <div className="flex items-center gap-2 text-blue-600">
                          <Clock className="h-5 w-5" />
                          <span className="text-sm font-medium">
                            Consulta realizada a las{" "}
                            {new Date().toLocaleTimeString("es-ES")}
                          </span>
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

                {/* 🌟 SECCIÓN DE PREDICCIÓN CLIMÁTICA - 7 DÍAS */}
                {showPrediction && prediction.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                          <Calendar className="h-7 w-7 text-purple-600" />
                          🔮 Predicción Climática - 7 Días
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Basada en datos históricos y clima actual de{" "}
                          {selectedArbol.nombre}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {overallTrend && (
                          <div
                            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
                              overallTrend.trend === "up"
                                ? "bg-red-100 text-red-700"
                                : overallTrend.trend === "down"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {overallTrend.trend === "up" && (
                              <TrendingUp className="h-4 w-4" />
                            )}
                            {overallTrend.trend === "down" && (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {overallTrend.trend === "stable" && (
                              <Minus className="h-4 w-4" />
                            )}
                            {overallTrend.trend === "up"
                              ? "Subiendo"
                              : overallTrend.trend === "down"
                                ? "Bajando"
                                : "Estable"}
                            {overallTrend.change !== 0 &&
                              ` (${overallTrend.change > 0 ? "+" : ""}${overallTrend.change}°C)`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Grid de predicciones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {prediction.map((pred, index) => (
                        <Card
                          key={index}
                          className={`border-2 transition-all hover:shadow-lg ${
                            pred.tempMax > 35
                              ? "border-red-300 bg-red-50"
                              : pred.tempMax > 30
                                ? "border-orange-300 bg-orange-50"
                                : pred.tempMax > 25
                                  ? "border-yellow-300 bg-yellow-50"
                                  : pred.tempMax > 20
                                    ? "border-green-300 bg-green-50"
                                    : "border-blue-300 bg-blue-50"
                          }`}
                        >
                          <CardContent className="pt-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-3xl mb-1">{pred.icon}</span>
                              <p className="text-sm font-bold text-gray-700">
                                {pred.date}
                              </p>
                              <p className="text-xs text-gray-500">
                                Día {pred.day}
                              </p>

                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xl font-bold text-red-600">
                                  {pred.tempMax}°
                                </span>
                                <span className="text-xs text-gray-400">|</span>
                                <span className="text-lg text-blue-600">
                                  {pred.tempMin}°
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                {pred.trend === "up" && (
                                  <TrendingUp className="h-3 w-3 text-red-500" />
                                )}
                                {pred.trend === "down" && (
                                  <TrendingDown className="h-3 w-3 text-blue-500" />
                                )}
                                {pred.trend === "stable" && (
                                  <Minus className="h-3 w-3 text-gray-500" />
                                )}
                                <span>
                                  {pred.trend === "up"
                                    ? `+${pred.tempChange}°`
                                    : pred.trend === "down"
                                      ? `${pred.tempChange}°`
                                      : "estable"}
                                </span>
                              </div>

                              <p className="text-xs text-gray-700 mt-2 font-medium">
                                {pred.description}
                              </p>

                              <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-2 border-t border-gray-200">
                                <div className="text-center">
                                  <p className="text-xs text-gray-500">
                                    💧 Humedad
                                  </p>
                                  <p className="text-sm font-semibold text-blue-600">
                                    {pred.humidity}%
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-500">
                                    💨 Viento
                                  </p>
                                  <p className="text-sm font-semibold text-teal-600">
                                    {pred.windSpeed} m/s
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Resumen de la predicción */}
                    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 border-2">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-purple-600" />
                              Resumen de la Predicción
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {overallTrend?.trend === "up"
                                ? `📈 Se espera un aumento gradual de temperatura. Prepara medidas contra el calor.`
                                : overallTrend?.trend === "down"
                                  ? `📉 Se espera un descenso gradual de temperatura. Protege tu árbol del frío.`
                                  : `➖ Temperaturas estables en los próximos días. Mantén el cuidado habitual.`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm">
                              <p className="text-xs text-gray-500">
                                Máxima esperada
                              </p>
                              <p className="text-lg font-bold text-red-600">
                                {Math.max(...prediction.map((p) => p.tempMax))}
                                °C
                              </p>
                            </div>
                            <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm">
                              <p className="text-xs text-gray-500">
                                Mínima esperada
                              </p>
                              <p className="text-lg font-bold text-blue-600">
                                {Math.min(...prediction.map((p) => p.tempMin))}
                                °C
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Recomendaciones de la predicción */}
                        <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100">
                          <p className="text-sm font-medium text-gray-700">
                            💡 Recomendación basada en la predicción:
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {overallTrend?.trend === "up" &&
                            prediction.some((p) => p.tempMax > 35)
                              ? `🔥 Alerta de calor en los próximos días. Asegúrate de tener suficiente agua y considera proporcionar sombra adicional a ${selectedArbol.nombre}.`
                              : overallTrend?.trend === "down" &&
                                  prediction.some((p) => p.tempMin < 10)
                                ? `❄️ Se esperan temperaturas bajas. Protege ${selectedArbol.nombre} de heladas si es necesario.`
                                : prediction.some((p) => p.humidity > 70)
                                  ? `🌧️ Alta humedad prevista en algunos días. Monitorea posibles lluvias y ajusta el riego.`
                                  : `✅ Condiciones generalmente favorables para ${selectedArbol.nombre}. Mantén el cuidado regular.`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

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

                        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                          <div className="absolute inset-0 flex items-center px-3">
                            <div
                              className="h-4 bg-indigo-200 rounded-full transition-all"
                              style={{
                                width: `${Math.min((parseFloat(getClimaticComparison(weatherHistory)?.avgHistoricTemp || "0") / 50) * 100, 100)}%`,
                              }}
                            />
                          </div>
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

                      {/* Diagnóstico General */}
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

                {/* REGLAS CLIMÁTICAS */}
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

                      {/* Regla 1 */}
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

                      {/* Regla 2 */}
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

                      {/* Pronóstico Final */}
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
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <CheckCircle className="h-7 w-7 text-green-600" />
                      Recomendaciones de Cuidado
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedArbol?.especie
                        ? `Sugerencias adaptadas a la especie: ${selectedArbol.especie}.`
                        : "Consejos ajustados a las condiciones del clima y a la especie del árbol."}
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {getDetailedAdvice(
                      weather.main?.temp,
                      weather.main?.humidity,
                      weather.wind?.speed,
                      selectedArbol?.especie,
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

                {/* Care Tips */}
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
                      Selecciona un árbol y haz clic en "Verificar Clima y
                      Predicción" para ver las condiciones actuales y la
                      predicción a 7 días
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
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    📋 Historial de Consultas Climáticas
                  </h2>
                  {session?.user?.email && (
                    <p className="text-sm text-gray-500 mt-1">
                      👤 Mostrando historial de:{" "}
                      <strong>{session.user.email}</strong>
                    </p>
                  )}
                </div>
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
