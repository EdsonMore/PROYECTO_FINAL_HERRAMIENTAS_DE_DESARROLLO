// app/api/arboles/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { query } from "@/lib/db"

type ArbolQueryMode = "full" | "summary" | "geo"

const ARBOLES_SELECTS: Record<ArbolQueryMode, string> = {
  full: `SELECT id, usuario_id, nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url, creado_en, actualizado_en
         FROM arboles`,
  summary: `SELECT id, nombre, especie, foto_url, creado_en
            FROM arboles`,
  geo: `SELECT id, nombre, especie, latitud, longitud, foto_url, creado_en
        FROM arboles`,
}

function parseOptionalPositiveInt(value: string | null) {
  if (!value) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

// GET - Obtener todos los árboles del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const { searchParams } = new URL(request.url)
    const mode = (searchParams.get("mode") as ArbolQueryMode) || "full"
    const selectedQuery = ARBOLES_SELECTS[mode] ?? ARBOLES_SELECTS.full
    const limit = parseOptionalPositiveInt(searchParams.get("limit"))
    const offset = parseOptionalPositiveInt(searchParams.get("offset"))

    let queryText = `${selectedQuery} WHERE usuario_id = $1 ORDER BY creado_en DESC`
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url } = body

    if (!nombre || !latitud || !longitud) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const usuarioId = parseInt(session.user.id)

    // Insertar el árbol
    const result = await query(
      `INSERT INTO arboles (usuario_id, nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [usuarioId, nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error al crear árbol:", error)
    return NextResponse.json({ error: "Error al crear árbol" }, { status: 500 })
  }
}
