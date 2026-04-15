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

    // Verificar si el usuario ya existe
    const existingUser = await query("SELECT id FROM usuarios WHERE email = $1", [email])

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 })
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    // Insertar nuevo usuario
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
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 })
  }
}
