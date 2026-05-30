// app/api/admin/users/create/route.ts
/**
 * POST /api/admin/users/create
 * Crea un nuevo usuario (solo admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute, logAudit, createUser, getUserInfo } from '@/lib/role-guards';
import { UserRole } from '@/types/roles';

export async function POST(req: NextRequest) {
  // Verificar que el usuario sea admin
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) {
    return response!;
  }

  try {
    const { nombre, apellido, email, telefono, contrasena, rol } = await req.json();

    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    if (!apellido || apellido.trim().length === 0) {
      return NextResponse.json(
        { error: 'El apellido es requerido' },
        { status: 400 }
      );
    }

    if (!email || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 }
      );
    }

    if (!contrasena || contrasena.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar rol si se proporciona
    if (rol && !Object.values(UserRole).includes(rol)) {
      return NextResponse.json(
        { error: `Rol inválido: ${rol}` },
        { status: 400 }
      );
    }

    // Crear usuario
    const newUser = await createUser({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono?.trim() || undefined,
      contrasena,
      rol: rol || UserRole.USER,
    });

    // Registrar en auditoría
    await logAudit({
      userId: context.userId,
      action: 'create_user',
      resource: 'user',
      resourceId: newUser.id,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      details: `Nuevo usuario creado: ${newUser.email} (${newUser.nombre} ${newUser.apellido}) con rol ${newUser.rol}`,
      statusCode: 201,
      changesAfter: {
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        email: newUser.email,
        telefono: newUser.telefono,
        rol: newUser.rol,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario creado exitosamente',
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creando usuario:', error);

    await logAudit({
      userId: context.userId,
      action: 'error_create_user',
      resource: 'user',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      details: error instanceof Error ? error.message : 'Error desconocido',
      statusCode: 500,
    });

    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
