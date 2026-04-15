// app/api/seguimientos/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { query } from "@/lib/db"

// PUT - Actualizar un seguimiento
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const seguimientoId = parseInt(id, 10)
    if (isNaN(seguimientoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { arbol_id, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento } = body

    const result = await query(
      `UPDATE seguimientos s
       SET arbol_id = $1, titulo = $2, descripcion = $3, foto_url = $4, 
           altura_cm = $5, salud = $6, fecha_seguimiento = $7, actualizado_en = NOW()
       FROM usuarios u
       WHERE s.id = $8 AND s.usuario_id = u.id AND u.email = $9
       RETURNING s.*`,
      [arbol_id, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento, seguimientoId, session.user.email],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Seguimiento no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error al actualizar seguimiento:", error)
    return NextResponse.json({ error: "Error al actualizar seguimiento" }, { status: 500 })
  }
}

// DELETE - Eliminar un seguimiento
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const seguimientoId = parseInt(id, 10)
    if (isNaN(seguimientoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const result = await query(
      `DELETE FROM seguimientos s
       USING usuarios u
       WHERE s.id = $1 AND s.usuario_id = u.id AND u.email = $2
       RETURNING s.id`,
      [seguimientoId, session.user.email],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Seguimiento no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Seguimiento eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar seguimiento:", error)
    return NextResponse.json({ error: "Error al eliminar seguimiento" }, { status: 500 })
  }
}
