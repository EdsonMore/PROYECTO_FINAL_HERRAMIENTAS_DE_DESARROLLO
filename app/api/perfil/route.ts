import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET - Obtener datos completos del perfil
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const result = await query(
      `SELECT id, nombre, email, avatar_url, fecha_registro 
       FROM usuarios WHERE email = $1`,
      [session.user.email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar perfil
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, avatar_url, password_actual, nueva_password } = body;

    // Obtener usuario actual
    const userResult = await query(
      "SELECT id, password_hash FROM usuarios WHERE email = $1",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const usuario = userResult.rows[0];
    let updateFields = [];
    let queryParams = [];
    let paramCount = 1;

    // Actualizar nombre si se proporciona
    if (nombre !== undefined && nombre !== "") {
      updateFields.push(`nombre = $${paramCount}`);
      queryParams.push(nombre);
      paramCount++;
    }

    // Actualizar avatar si se proporciona
    if (avatar_url !== undefined && avatar_url !== "") {
      // Validar que sea una URL válida o base64
      if (
        !avatar_url.startsWith("http") &&
        !avatar_url.startsWith("data:image")
      ) {
        return NextResponse.json(
          { error: "URL de imagen inválida" },
          { status: 400 }
        );
      }

      // Si es base64 y es muy largo, truncar a un tamaño razonable
      if (avatar_url.startsWith("data:image")) {
        // Guardar en base64 directamente (PostgreSQL soporta texto largo)
        updateFields.push(`avatar_url = $${paramCount}`);
        queryParams.push(avatar_url);
        paramCount++;
      } else {
        updateFields.push(`avatar_url = $${paramCount}`);
        queryParams.push(avatar_url);
        paramCount++;
      }
    }

    // Actualizar contraseña si se proporciona
    if (password_actual && nueva_password) {
      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(
        password_actual,
        usuario.password_hash
      );
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Contraseña actual incorrecta" },
          { status: 400 }
        );
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(nueva_password, 12);
      updateFields.push(`password_hash = $${paramCount}`);
      queryParams.push(hashedPassword);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    // Agregar fecha de actualización y ID del usuario
    updateFields.push(`actualizado_en = NOW()`);
    queryParams.push(usuario.id);

    const queryText = `
      UPDATE usuarios 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramCount}
      RETURNING id, nombre, email, avatar_url, fecha_registro
    `;

    const result = await query(queryText, queryParams);

    return NextResponse.json({
      message: "Perfil actualizado correctamente",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}
