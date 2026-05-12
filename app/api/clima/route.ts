import { NextResponse } from "next/server";

interface WeatherData {
  temperature?: number;
  humidity?: number;
  precipitation?: number;
  weather_description?: string;
}

async function getWeatherFromOpenMeteo(lat: number, lng: number): Promise<WeatherData> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&temperature_unit=celsius`
    );
    const data = await res.json();

    if (data.current) {
      return {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        precipitation: data.current.precipitation,
        weather_description: getWeatherDescription(data.current.weather_code),
      };
    }
    return {};
  } catch (error) {
    console.error("Error fetching weather from Open-Meteo:", error);
    return {};
  }
}

function getWeatherDescription(code: number): string {
  const weatherCodes: { [key: number]: string } = {
    0: "Cielo despejado",
    1: "Principalmente despejado",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Niebla",
    48: "Niebla con escarcha",
    51: "Llovizna ligera",
    53: "Llovizna moderada",
    55: "Llovizna densa",
    61: "Lluvia ligera",
    63: "Lluvia moderada",
    65: "Lluvia densa",
    71: "Nieve ligera",
    73: "Nieve moderada",
    75: "Nieve densa",
    77: "Granos de nieve",
    80: "Lluvia ligera e intermitente",
    81: "Lluvia moderada e intermitente",
    82: "Lluvia densa e intermitente",
    85: "Nieve ligera intermitente",
    86: "Nieve moderada intermitente",
    95: "Tormenta",
    96: "Tormenta con granizo ligero",
    99: "Tormenta con granizo densa",
  };
  return weatherCodes[code] || "Desconocido";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Parámetros lat y lng requeridos" },
        { status: 400 }
      );
    }

    const weather = await getWeatherFromOpenMeteo(Number(lat), Number(lng));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      coordinates: {
        latitude: Number(lat),
        longitude: Number(lng),
      },
      clima: {
        temperatura: weather.temperature,
        humedad: weather.humidity,
        precipitacion: weather.precipitation,
        descripcion: weather.weather_description,
      },
    });
  } catch (error) {
    console.error("Error en API clima:", error);
    return NextResponse.json(
      { error: "Error al obtener datos climáticos" },
      { status: 500 }
    );
  }
}
