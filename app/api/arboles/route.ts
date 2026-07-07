// app/api/arboles/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { protectRoute } from "@/lib/route-guards"
import { query } from "@/lib/db"

type ArbolQueryMode = "full" | "summary" | "geo"

const ARBOLES_SELECTS: Record<ArbolQueryMode, string> = {
  full: `SELECT a.id, a.usuario_id, a.nombre, a.especie, a.latitud, a.longitud, a.fecha_plantacion, a.descripcion, a.foto_url, a.estado_salud, a.altura_actual_cm, a.diametro_tronco_cm, a.creado_en, a.actualizado_en
         FROM arboles a`,
  summary: `SELECT a.id, a.nombre, a.especie, a.foto_url, a.estado_salud, a.creado_en
            FROM arboles a`,
  geo: `SELECT a.id, a.nombre, a.especie, a.latitud, a.longitud, a.foto_url, a.estado_salud, a.creado_en
        FROM arboles a`,
}

function parseOptionalPositiveInt(value: string | null) {
  if (!value) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

// Helper: auto-registra especie en catálogo si no existe
async function autoRegistrarEspecie(especie: string) {
  if (!especie || especie.trim().length < 2) return;
  try {
    await query(
      `INSERT INTO admin_content_items (tipo, nombre, descripcion, estado)
       VALUES ('especie', $1, 'Registrada automáticamente por usuario', 'ACTIVO')
       ON CONFLICT (tipo, nombre) DO NOTHING`,
      [especie.trim()]
    );
  } catch (e) {
    // No bloquear el flujo si falla el registro en catálogo
    console.warn('No se pudo auto-registrar especie en catálogo:', e);
  }
}

// GET - Obtener todos los árboles del usuario
export async function GET(request: NextRequest) {
  try {
    const { error, userId } = await protectRoute()
    if (error) return error
    const { searchParams } = new URL(request.url)
    const mode = (searchParams.get("mode") as ArbolQueryMode) || "full"
    const selectedQuery = ARBOLES_SELECTS[mode] ?? ARBOLES_SELECTS.full
    const limit = parseOptionalPositiveInt(searchParams.get("limit"))
    const offset = parseOptionalPositiveInt(searchParams.get("offset"))

    let queryText = `${selectedQuery} WHERE a.usuario_id = $1 ORDER BY a.creado_en DESC`
    const queryParams: Array<number> = [userId]

    if (limit !== null) {
      queryText += ` LIMIT $${queryParams.length + 1}`
      queryParams.push(limit)
    }

    if (offset !== null) {
      queryText += ` OFFSET $${queryParams.length + 1}`
      queryParams.push(offset)
    }

    const result = await query(queryText, queryParams)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error al obtener árboles:", error)
    return NextResponse.json({ error: "Error al obtener árboles" }, { status: 500 })
  }
}

// POST - Crear un nuevo árbol
export async function POST(request: NextRequest) {
  try {
    const { error, userId } = await protectRoute()
    if (error) return error

    const body = await request.json()
    const { nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url, estado_salud, altura_actual_cm, diametro_tronco_cm } = body

    if (!nombre || !latitud || !longitud) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Auto-registrar especie en catálogo si se proporcionó
    if (especie) {
      await autoRegistrarEspecie(especie);
    }

    const fotoFinal = foto_url?.trim() || null;
    const alturaFinal = altura_actual_cm ? Number.parseFloat(altura_actual_cm) : null;
    const diametroFinal = diametro_tronco_cm ? Number.parseFloat(diametro_tronco_cm) : null;
    const saludFinal = estado_salud ? estado_salud.toUpperCase() : null;

    // Insertar el árbol
    const result = await query(
      `INSERT INTO arboles (usuario_id, nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url, estado_salud, altura_actual_cm, diametro_tronco_cm)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [userId, nombre, especie, latitud, longitud, fecha_plantacion, descripcion, fotoFinal, saludFinal, alturaFinal, diametroFinal],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error al crear árbol:", error)
    return NextResponse.json({ error: "Error al crear árbol" }, { status: 500 })
  }
}
