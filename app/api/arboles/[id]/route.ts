// app/api/arboles/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { query } from "@/lib/db"

// GET - Obtener un árbol específico
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const treeId = parseInt(id, 10)
    if (isNaN(treeId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const result = await query(
      `SELECT a.* FROM arboles a
       INNER JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.id = $1 AND u.email = $2`,
      [treeId, session.user.email],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Árbol no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error al obtener árbol:", error)
    return NextResponse.json({ error: "Error al obtener árbol" }, { status: 500 })
  }
}

// PUT - Actualizar un árbol
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const treeId = parseInt(id, 10)
    if (isNaN(treeId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url } = body

    const result = await query(
      `UPDATE arboles a
       SET nombre = $1, especie = $2, latitud = $3, longitud = $4, 
           fecha_plantacion = $5, descripcion = $6, foto_url = $7, actualizado_en = NOW()
       FROM usuarios u
       WHERE a.id = $8 AND a.usuario_id = u.id AND u.email = $9
       RETURNING a.*`,
      [nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url, treeId, session.user.email],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Árbol no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error al actualizar árbol:", error)
    return NextResponse.json({ error: "Error al actualizar árbol" }, { status: 500 })
  }
}

// DELETE - Eliminar un árbol
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const treeId = parseInt(id, 10)
    if (isNaN(treeId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const result = await query(
      `DELETE FROM arboles a
       USING usuarios u
       WHERE a.id = $1 AND a.usuario_id = u.id AND u.email = $2
       RETURNING a.id`,
      [treeId, session.user.email],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Árbol no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Árbol eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar árbol:", error)
    return NextResponse.json({ error: "Error al eliminar árbol" }, { status: 500 })
  }
}
