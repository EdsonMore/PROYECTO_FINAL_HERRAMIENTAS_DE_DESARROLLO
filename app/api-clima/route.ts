import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const API_KEY = process.env.WEATHER_API_KEY;
  const { searchParams } = new URL(request.url);

  // Obtener parámetros: lat, lon, o location (nombre de ciudad)
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const location = searchParams.get("location") || "Piura";

  if (!API_KEY) {
    return NextResponse.json(
      { error: "API_KEY no configurada" },
      { status: 500 },
    );
  }

  let url: string;

  // Si se proporcionan coordenadas, usar la API de coordenadas
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  } else {
    // Si no, usar búsqueda por nombre de ciudad
    url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching weather:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de clima" },
      { status: 500 },
    );
  }
}
