// app/api/arboles/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { protectRoute, validateResourceOwnership } from "@/lib/route-guards"
import { query } from "@/lib/db"

// GET - Obtener un árbol específico
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError, userId } = await protectRoute()
    if (authError) return authError

    const { id } = await params
    const treeId = parseInt(id, 10)
    if (isNaN(treeId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const { error, resource } = await validateResourceOwnership(
      "arboles",
      treeId,
      userId,
      "id, usuario_id, nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url, estado_salud, altura_actual_cm, diametro_tronco_cm, creado_en, actualizado_en"
    )

    if (error) return error
    return NextResponse.json(resource)
  } catch (error) {
    console.error("Error al obtener árbol:", error)
    return NextResponse.json({ error: "Error al obtener árbol" }, { status: 500 })
  }
}

// PUT - Actualizar un árbol
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError, userId } = await protectRoute()
    if (authError) return authError

    const { id } = await params
    const treeId = parseInt(id, 10)
    if (isNaN(treeId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url, estado_salud, altura_actual_cm, diametro_tronco_cm } = body

    // Validar que el usuario es propietario del árbol
    const { error: ownershipError } = await validateResourceOwnership("arboles", treeId, userId)
    if (ownershipError) return ownershipError

    const fotoFinal = foto_url?.trim() || null;
    const alturaFinal = altura_actual_cm ? Number.parseFloat(altura_actual_cm) : null;
    const diametroFinal = diametro_tronco_cm ? Number.parseFloat(diametro_tronco_cm) : null;
    const saludFinal = estado_salud ? estado_salud.toUpperCase() : null;

    const result = await query(
      `UPDATE arboles
       SET nombre = $1, especie = $2, latitud = $3, longitud = $4, 
           fecha_plantacion = $5, descripcion = $6, foto_url = $7,
           estado_salud = $8, altura_actual_cm = $9, diametro_tronco_cm = $10,
           actualizado_en = NOW()
       WHERE id = $11 AND usuario_id = $12 AND deleted_at IS NULL
       RETURNING *`,
      [nombre, especie, latitud, longitud, fecha_plantacion, descripcion, fotoFinal, saludFinal, alturaFinal, diametroFinal, treeId, userId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Árbol no encontrado" }, { status: 404 })
    }

    // Auto-registrar especie en catálogo si se proporcionó
    if (especie && especie.trim().length >= 2) {
      try {
        await query(
          `INSERT INTO admin_content_items (tipo, nombre, descripcion, estado)
           VALUES ('especie', $1, 'Registrada automáticamente por usuario', 'ACTIVO')
           ON CONFLICT (tipo, nombre) DO NOTHING`,
          [especie.trim()]
        );
      } catch (e) {
        console.warn('No se pudo auto-registrar especie en catálogo:', e);
      }
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
    const { error: authError, userId } = await protectRoute()
    if (authError) return authError

    const { id } = await params
    const treeId = parseInt(id, 10)
    if (isNaN(treeId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Validar que el usuario es propietario del árbol
    const { error: ownershipError } = await validateResourceOwnership("arboles", treeId, userId)
    if (ownershipError) return ownershipError

    const result = await query(
      `UPDATE arboles
       SET deleted_at = NOW()
       WHERE id = $1 AND usuario_id = $2
       RETURNING id`,
      [treeId, userId],
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
