// app/api/admin/users/[id]/role/route.ts
/**
 * PUT /api/admin/users/[id]/role
 * Actualiza el rol de un usuario
 * Solo accesible para administradores
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute, logAudit, updateUserRole, getUserInfo } from '@/lib/role-guards';
import { UserRole } from '@/types/roles';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  // Verificar que el usuario sea admin
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) {
    return response!;
  }

  try {
    const userId = parseInt(params.id);
    const { role } = await req.json();

    // Validar que el rol sea válido
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: `Rol inválido: ${role}` },
        { status: 400 }
      );
    }

    // No permitir que un admin se quite su propio rol de admin
    if (userId === context.userId && role === UserRole.USER) {
      return NextResponse.json(
        { error: 'No puedes remover tu propio rol de administrador' },
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

    // Cambiar rol
    const updatedUser = await updateUserRole(userId, role);

    if (!updatedUser) {
      throw new Error('Error al actualizar rol');
    }

    // Registrar en auditoría
    await logAudit({
      userId: context.userId,
      action: 'update_user_role',
      resource: 'user',
      resourceId: userId,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      changesBefore: { role: userBefore.rol },
      changesAfter: { role },
      details: `Cambio de rol de ${userBefore.rol} a ${role} para usuario ${userBefore.email}`,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      message: `Rol actualizado a ${role}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error('❌ Error actualizando rol:', error);

    await logAudit({
      userId: context.userId,
      action: 'error_update_user_role',
      resource: 'user',
      resourceId: parseInt(params.id),
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      details: error instanceof Error ? error.message : 'Error desconocido',
      statusCode: 500,
    });

    return NextResponse.json(
      { error: 'Error actualizando rol del usuario' },
      { status: 500 }
    );
  }
}
