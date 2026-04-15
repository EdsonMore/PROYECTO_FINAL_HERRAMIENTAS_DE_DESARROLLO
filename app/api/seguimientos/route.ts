// app/api/seguimientos/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { query } from "@/lib/db"

// GET - Obtener seguimientos (todos o de un árbol específico)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const arbolId = searchParams.get("arbol_id")

    let result
    if (arbolId) {
      result = await query(
        `SELECT s.*, a.nombre as arbol_nombre FROM seguimientos s
         INNER JOIN arboles a ON s.arbol_id = a.id
         INNER JOIN usuarios u ON s.usuario_id = u.id
         WHERE s.arbol_id = $1 AND u.email = $2
         ORDER BY s.fecha_seguimiento DESC`,
        [arbolId, session.user.email],
      )
    } else {
      result = await query(
        `SELECT s.*, a.nombre as arbol_nombre FROM seguimientos s
         INNER JOIN arboles a ON s.arbol_id = a.id
         INNER JOIN usuarios u ON s.usuario_id = u.id
         WHERE u.email = $1
         ORDER BY s.fecha_seguimiento DESC`,
        [session.user.email],
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { arbol_id, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento } = body

    if (!arbol_id || !titulo) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Obtener el ID del usuario
    const userResult = await query("SELECT id FROM usuarios WHERE email = $1", [session.user.email])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const usuarioId = userResult.rows[0].id

    // Verificar que el árbol pertenece al usuario
    const arbolResult = await query("SELECT id FROM arboles WHERE id = $1 AND usuario_id = $2", [arbol_id, usuarioId])

    if (arbolResult.rows.length === 0) {
      return NextResponse.json({ error: "Árbol no encontrado" }, { status: 404 })
    }

    // Insertar el seguimiento
    const result = await query(
      `INSERT INTO seguimientos (arbol_id, usuario_id, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [arbol_id, usuarioId, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento || new Date()],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error al crear seguimiento:", error)
    return NextResponse.json({ error: "Error al crear seguimiento" }, { status: 500 })
  }
}
