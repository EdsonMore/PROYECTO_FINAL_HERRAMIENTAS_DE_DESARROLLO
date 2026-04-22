import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { nombre, email, password } = await request.json()

    // Validaciones
    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    try {
      // Insertar nuevo usuario - si el email ya existe, PostgreSQL lanzará un error de constraint
      const result = await query(
        "INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email",
        [nombre, email, passwordHash],
      )

      const newUser = result.rows[0]

      return NextResponse.json(
        {
          message: "Usuario registrado exitosamente",
          user: {
            id: newUser.id,
            nombre: newUser.nombre,
            email: newUser.email,
          },
        },
        { status: 201 },
      )
    } catch (dbError: any) {
      // Capturar error de constraint único (código 23505 en PostgreSQL)
      if (dbError.code === "23505") {
        return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 })
      }
      throw dbError
    }
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 })
  }
}
