import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"
import { isPasswordValid, isValidEmail, isValidName, getPasswordErrorMessage, validatePassword } from "@/lib/password-utils"

export async function POST(request: Request) {
  try {
    const { nombre, apellido, email, password, telefono } = await request.json()

    // ==================== VALIDACIONES ====================

    // 1. Validar que los campos requeridos estén presentes
    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, apellido, email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // 2. Validar formato de nombre y apellido
    if (!isValidName(nombre)) {
      return NextResponse.json(
        { error: "El nombre debe tener al menos 2 caracteres" },
        { status: 400 }
      )
    }

    if (!isValidName(apellido)) {
      return NextResponse.json(
        { error: "El apellido debe tener al menos 2 caracteres" },
        { status: 400 }
      )
    }

    // 3. Validar email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "El email no tiene un formato válido" },
        { status: 400 }
      )
    }

    // Convertir email a minúsculas
    const normalizedEmail = email.toLowerCase().trim()

    // 4. Validar contraseña (8+ caracteres, mayúscula, minúscula, número)
    if (!isPasswordValid(password)) {
      const validation = validatePassword(password)
      const errorMsg = getPasswordErrorMessage(validation)
      return NextResponse.json(
        { error: `Contraseña débil. ${errorMsg}` },
        { status: 400 }
      )
    }

    // 5. Validar teléfono si está presente
    if (telefono && typeof telefono === "string") {
      const telefonoLimpio = telefono.replace(/\D/g, "")
      if (telefonoLimpio.length < 7) {
        return NextResponse.json(
          { error: "El teléfono debe tener al menos 7 dígitos" },
          { status: 400 }
        )
      }
    }

    // ==================== HASH Y REGISTRO ====================

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    try {
      // Insertar nuevo usuario
      const result = await query(
        `INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, nombre, apellido, email`,
        [nombre.trim(), apellido.trim(), normalizedEmail, passwordHash, telefono || null],
      )

      const newUser = result.rows[0]

      return NextResponse.json(
        {
          message: "Usuario registrado exitosamente",
          user: {
            id: newUser.id,
            nombre: newUser.nombre,
            apellido: newUser.apellido,
            email: newUser.email,
          },
        },
        { status: 201 },
      )
    } catch (dbError: any) {
      // Capturar error de constraint único (código 23505 en PostgreSQL)
      if (dbError.code === "23505") {
        return NextResponse.json(
          { error: "Este email ya está registrado en el sistema" },
          { status: 400 }
        )
      }
      throw dbError
    }
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error al registrar usuario. Por favor intenta más tarde" },
      { status: 500 }
    )
  }
}
