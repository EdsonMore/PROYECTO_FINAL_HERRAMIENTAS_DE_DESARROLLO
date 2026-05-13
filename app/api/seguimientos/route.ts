// app/api/seguimientos/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { protectRoute, validateResourceOwnership } from "@/lib/route-guards"
import { query } from "@/lib/db"

// GET - Obtener seguimientos (todos o de un árbol específico)
export async function GET(request: NextRequest) {
  try {
    const { error, userId } = await protectRoute()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const arbolId = searchParams.get("arbol_id")

    let result
    if (arbolId) {
      result = await query(
        `SELECT s.id, s.arbol_id, s.usuario_id, s.titulo, s.descripcion, s.foto_url, s.altura_cm, s.salud, s.fecha_seguimiento, s.creado_en, s.actualizado_en, a.nombre as arbol_nombre 
         FROM seguimientos s
         INNER JOIN arboles a ON s.arbol_id = a.id
         WHERE s.arbol_id = $1 AND s.usuario_id = $2 AND a.usuario_id = $2
         ORDER BY s.fecha_seguimiento DESC`,
        [arbolId, userId],
      )
    } else {
      result = await query(
        `SELECT s.id, s.arbol_id, s.usuario_id, s.titulo, s.descripcion, s.foto_url, s.altura_cm, s.salud, s.fecha_seguimiento, s.creado_en, s.actualizado_en, a.nombre as arbol_nombre 
         FROM seguimientos s
         INNER JOIN arboles a ON s.arbol_id = a.id
         WHERE s.usuario_id = $1
         ORDER BY s.fecha_seguimiento DESC`,
        [userId],
      )
    }

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error al obtener seguimientos:", error)
    return NextResponse.json({ error: "Error al obtener seguimientos" }, { status: 500 })
  }
}

// POST - Crear un nuevo seguimiento
export async function POST(request: NextRequest) {
  try {
    const { error, userId } = await protectRoute()
    if (error) return error

    const body = await request.json()
    const { arbol_id, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento } = body

    if (!arbol_id || !titulo) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar que el árbol pertenece al usuario
    const { error: ownershipError } = await validateResourceOwnership("arboles", arbol_id, userId)
    if (ownershipError) return ownershipError

    // Insertar el seguimiento
    const result = await query(
      `INSERT INTO seguimientos (arbol_id, usuario_id, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [arbol_id, userId, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento || new Date()],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error al crear seguimiento:", error)
    return NextResponse.json({ error: "Error al crear seguimiento" }, { status: 500 })
  }
}
