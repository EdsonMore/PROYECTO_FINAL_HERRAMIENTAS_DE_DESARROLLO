import { type NextRequest, NextResponse } from "next/server";

interface WeatherData {
  success: boolean;
  timestamp: string;
  location: {
    city: string;
    lat: number;
    lon: number;
    country: string;
  };
  current: {
    temperatura: number;
    sensacion_termica: number;
    humedad: number;
    presion: number;
    velocidad_viento: number;
    direccion_viento: number;
    precipitacion: number;
    nubosidad: number;
    radiacion_solar: number;
    visibilidad: number;
    condicion: string;
    descripcion: string;
    icono: string;
  };
  indices: {
    indice_uv: number;
    indice_calor: string;
    riesgo_sequedad: string;
    indice_supervivencia: number;
    riesgo_ambiental: string;
  };
  recomendaciones_arbol?: string[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const API_KEY = process.env.WEATHER_API_KEY;
  const { searchParams } = new URL(request.url);

  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const location = searchParams.get("location") || "Piura";
  const tree_species = searchParams.get("species");

  if (!API_KEY) {
    return NextResponse.json(
      { error: "API_KEY no configurada", success: false },
      { status: 500 },
    );
  }

  if (lat && lon) {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return NextResponse.json(
        { error: "Coordenadas inválidas", success: false },
        { status: 400 },
      );
    }
  }

  const url = lat && lon
    ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    : `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.error("Weather API error:", data);
      return NextResponse.json(
        { error: data.message || "Error al obtener clima", success: false },
        { status: res.status },
      );
    }

    const weatherData: WeatherData = {
      success: true,
      timestamp: new Date().toISOString(),
      location: {
        city: data.name,
        lat: data.coord.lat,
        lon: data.coord.lon,
        country: data.sys.country,
      },
      current: {
        temperatura: data.main.temp,
        sensacion_termica: data.main.feels_like,
        humedad: data.main.humidity,
        presion: data.main.pressure,
        velocidad_viento: data.wind.speed,
        direccion_viento: data.wind.deg || 0,
        precipitacion: data.rain?.["1h"] || 0,
        nubosidad: data.clouds.all,
        radiacion_solar: calcularRadiacionSolar(data.clouds.all, Math.sin((data.dt * 15) % 360 * Math.PI / 180)),
        visibilidad: data.visibility,
        condicion: data.weather[0].main,
        descripcion: data.weather[0].description,
        icono: data.weather[0].icon,
      },
      indices: {
        indice_uv: calcularIndiceUV(data.main.temp, data.clouds.all),
        indice_calor: calcularIndiceCalor(data.main.temp, data.main.humidity),
        riesgo_sequedad: calcularRiesgoSequedad(data.main.humidity, data.rain?.["1h"] || 0),
      },
    };

    // Calcular índices de supervivencia
    const indice_uv = weatherData.indices.indice_uv;
    weatherData.indices.indice_supervivencia = calcularIndiceSupervisencia(
      data.main.temp,
      data.main.humidity,
      data.wind.speed,
      data.rain?.["1h"] || 0,
      indice_uv,
      weatherData.indices.indice_calor
    );
    weatherData.indices.riesgo_ambiental = evaluarRiesgoAmbiental(
      weatherData.indices.indice_supervivencia,
      weatherData.indices.riesgo_sequedad,
      weatherData.indices.indice_calor
    );

    if (tree_species) {
      weatherData.recomendaciones_arbol = generarRecomendaciones(tree_species, weatherData.current, weatherData.indices);
    }

    const response = NextResponse.json(weatherData);
    response.headers.set("Cache-Control", "public, max-age=300");
    return response;
  } catch (error) {
    console.error("Error fetching weather:", error);
    return NextResponse.json(
      {
        error: "Error al obtener datos de clima",
        success: false,
      },
      { status: 500 },
    );
  }
}

function calcularRadiacionSolar(nubosidad: number, elevation: number): number {
  const radiacionMaxima = 1000;
  const factor_nubosidad = 1 - (nubosidad / 100) * 0.8;
  const factor_elevacion = Math.max(0, elevation);
  return Math.round(radiacionMaxima * factor_nubosidad * factor_elevacion);
}

function calcularIndiceUV(temperatura: number, nubosidad: number): number {
  let indice = 0;
  if (temperatura > 25) indice += 4;
  else if (temperatura > 15) indice += 2;

  indice = indice * (1 - nubosidad / 100);
  return Math.round(Math.max(0, Math.min(11, indice)) * 10) / 10;
}

function calcularIndiceCalor(temperatura: number, humedad: number): string {
  if (temperatura < 15) return "bajo";
  if (temperatura < 25) return "moderado";
  if (temperatura < 35) return "alto";
  return "extremo";
}

function calcularRiesgoSequedad(humedad: number, precipitacion: number): string {
  let riesgo_base = 100 - humedad;
  if (precipitacion > 5) riesgo_base -= 20;

  if (riesgo_base < 20) return "bajo";
  if (riesgo_base < 50) return "moderado";
  return "alto";
}

function calcularIndiceSupervisencia(
  temperatura: number,
  humedad: number,
  velocidad_viento: number,
  precipitacion: number,
  indice_uv: number,
  indice_calor: string
): number {
  // Score de 0-100 para supervivencia
  let score = 100;

  // Temperatura óptima 15-28°C
  if (temperatura < 10 || temperatura > 40) score -= 25;
  else if (temperatura < 15 || temperatura > 35) score -= 15;
  else if (temperatura < 18 || temperatura > 30) score -= 5;

  // Humedad óptima 40-80%
  if (humedad < 25 || humedad > 95) score -= 20;
  else if (humedad < 35 || humedad > 85) score -= 10;

  // Viento excesivo
  if (velocidad_viento > 20) score -= 20;
  else if (velocidad_viento > 15) score -= 10;

  // UV
  if (indice_uv > 9) score -= 15;
  else if (indice_uv > 7) score -= 8;

  // Calor extremo
  if (indice_calor === "extremo") score -= 20;
  else if (indice_calor === "alto") score -= 10;

  // Precipitación excesiva (riesgo de encharcamiento)
  if (precipitacion > 50) score -= 15;
  else if (precipitacion > 20) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function evaluarRiesgoAmbiental(
  indice_supervivencia: number,
  riesgo_sequedad: string,
  indice_calor: string
): string {
  if (indice_supervivencia >= 80) return "bajo";
  if (indice_supervivencia >= 60) {
    if (riesgo_sequedad === "alto") return "moderado";
    return "bajo";
  }
  if (indice_supervivencia >= 40) return "moderado";
  if (indice_supervivencia >= 20) return "alto";
  return "crítico";
}

function generarRecomendaciones(especie: string, clima: WeatherData["current"], indices: WeatherData["indices"]): string[] {
  const recomendaciones: string[] = [];

  // Recomendaciones por riesgo ambiental
  if (indices.riesgo_ambiental === "crítico") {
    recomendaciones.push("🚨 RIESGO CRÍTICO: Condiciones extremas para la supervivencia del árbol");
    recomendaciones.push("❌ Intervención urgente requerida");
  } else if (indices.riesgo_ambiental === "alto") {
    recomendaciones.push("⚠️ RIESGO ALTO: Condiciones desfavorables para el árbol");
  } else if (indices.riesgo_ambiental === "moderado") {
    recomendaciones.push("⚡ Monitoreo constante recomendado");
  } else {
    recomendaciones.push("✅ Condiciones favorables para la supervivencia");
  }

  if (clima.humedad < 30 && indices.riesgo_sequedad === "alto") {
    recomendaciones.push("💧 Riego urgente: humedad muy baja");
  }

  if (clima.temperatura > 35) {
    recomendaciones.push("🌡️ Proporcionar sombra o riego frecuente");
  }

  if (indices.indice_uv > 7) {
    recomendaciones.push("☀️ Proteger del sol intenso");
  }

  if (clima.velocidad_viento > 15) {
    recomendaciones.push("💨 Viento fuerte: revisar estabilidad");
  }

  if (clima.precipitacion > 10) {
    recomendaciones.push("🌧️ Drenaje adecuado después de lluvia intensa");
  }

  return recomendaciones;
}
