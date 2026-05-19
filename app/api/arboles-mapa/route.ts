import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { HEALTH_STATUS } from "@/lib/health-utils";

export async function GET() {
  try {
    const result = await query(
      `SELECT DISTINCT ON (a.id)
        a.id,
        a.nombre,
        a.especie,
        a.latitud,
        a.longitud,
        a.foto_url,
        (SELECT s.salud FROM seguimientos s WHERE s.arbol_id = a.id ORDER BY s.fecha_seguimiento DESC LIMIT 1) as estado_salud
       FROM arboles a
       ORDER BY a.id`
    );

    const arboles = result.rows.map((arbol) => {
      const health = arbol.estado_salud || "sin-datos";
      const colorInfo = HEALTH_STATUS[health as keyof typeof HEALTH_STATUS] || {
        color: "#94a3b8",
        emoji: "❓",
        label: "Sin datos",
      };

      return {
        id: arbol.id,
        nombre: arbol.nombre,
        especie: arbol.especie,
        latitud: Number(arbol.latitud),
        longitud: Number(arbol.longitud),
        foto_url: arbol.foto_url,
        estado_salud: arbol.estado_salud,
        color: colorInfo.color,
        emoji: colorInfo.emoji,
        label: colorInfo.label,
        // Formato GeoJSON
        geometry: {
          type: "Point",
          coordinates: [Number(arbol.longitud), Number(arbol.latitud)],
        },
        properties: {
          nombre: arbol.nombre,
          especie: arbol.especie || "Sin especificar",
          estado: arbol.estado_salud || "Sin datos",
          color: colorInfo.color,
          emoji: colorInfo.emoji,
        },
      };
    });

    return NextResponse.json({
      success: true,
      total: arboles.length,
      arboles: arboles,
      // Formato GeoJSON FeatureCollection
      geojson: {
        type: "FeatureCollection",
        features: arboles.map((arbol) => ({
          type: "Feature",
          geometry: arbol.geometry,
          properties: arbol.properties,
        })),
      },
    });
  } catch (error) {
    console.error("Error en API arboles-mapa:", error);
    return NextResponse.json(
      { error: "Error al obtener árboles para el mapa" },
      { status: 500 }
    );
  }
}
