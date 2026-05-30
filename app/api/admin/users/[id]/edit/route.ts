// app/api/admin/users/[id]/edit/route.ts
/**
 * PUT /api/admin/users/[id]/edit
 * Edita información de un usuario (nombre, email, estado)
 * Solo accesible para administradores
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute, logAudit, updateUser, getUserInfo } from '@/lib/role-guards';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  // Verificar que el usuario sea admin
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) {
    return response!;
  }

  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    const { nombre, apellido, email, telefono, estado } = await req.json();

    // Al menos un campo debe ser proporcionado
    if (!nombre && !apellido && email === undefined && telefono === undefined && estado === undefined) {
      return NextResponse.json(
        { error: 'Al menos un campo debe ser proporcionado para actualizar' },
        { status: 400 }
      );
    }

    // Obtener usuario antes de cambiar
    const userBefore = await getUserInfo(userId);
    if (!userBefore) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Validaciones
    if (nombre !== undefined && nombre.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre no puede estar vacío' },
        { status: 400 }
      );
    }

    if (apellido !== undefined && apellido.trim().length === 0) {
      return NextResponse.json(
        { error: 'El apellido no puede estar vacío' },
        { status: 400 }
      );
    }

    if (email !== undefined && email.trim().length === 0) {
      return NextResponse.json(
        { error: 'El email no puede estar vacío' },
        { status: 400 }
      );
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        );
      }
    }

    // Actualizar usuario
    const updatedUser = await updateUser(userId, {
      nombre: nombre !== undefined ? nombre.trim() : undefined,
      apellido: apellido !== undefined ? apellido.trim() : undefined,
      email: email !== undefined ? email.trim().toLowerCase() : undefined,
      telefono: telefono !== undefined ? telefono.trim() || undefined : undefined,
      estado: estado as 'ACTIVO' | 'INACTIVO' | undefined,
    });

    if (!updatedUser) {
      throw new Error('Error al actualizar usuario');
    }

    // Registrar en auditoría
    await logAudit({
      userId: context.userId,
      action: 'update_user',
      resource: 'user',
      resourceId: userId,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      changesBefore: {
        nombre: userBefore.nombre,
        apellido: userBefore.apellido,
        email: userBefore.email,
        telefono: userBefore.telefono,
        estado: userBefore.estado,
      },
      changesAfter: {
        nombre: updatedUser.nombre,
        apellido: updatedUser.apellido,
        email: updatedUser.email,
        telefono: updatedUser.telefono,
        estado: updatedUser.estado,
      },
      details: `Usuario ${userBefore.email} actualizado`,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser,
    });
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);

    await logAudit({
      userId: context.userId,
      action: 'error_update_user',
      resource: 'user',
      resourceId: userId,
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
