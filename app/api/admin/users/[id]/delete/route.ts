// app/api/admin/users/[id]/delete/route.ts
/**
 * DELETE /api/admin/users/[id]/delete
 * Elimina (soft delete) un usuario
 * Solo accesible para administradores
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute, logAudit, deleteUser, getUserInfo } from '@/lib/role-guards';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    // No permitir que un admin se elimine a sí mismo
    if (userId === context.userId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      );
    }

    // Obtener usuario antes de eliminar
    const userBefore = await getUserInfo(userId);
    if (!userBefore) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar usuario (soft delete)
    const deletedUser = await deleteUser(userId);

    if (!deletedUser) {
      throw new Error('Error al eliminar usuario');
    }

    // Registrar en auditoría
    await logAudit({
      userId: context.userId,
      action: 'delete_user',
      resource: 'user',
      resourceId: userId,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      changesBefore: {
        nombre: userBefore.nombre,
        apellido: userBefore.apellido,
        email: userBefore.email,
        telefono: userBefore.telefono,
        rol: userBefore.rol,
        estado: userBefore.estado,
      },
      changesAfter: {
        estado: 'INACTIVO',
      },
      details: `Usuario ${userBefore.nombre} ${userBefore.apellido} (${userBefore.email}) eliminado (soft delete - marcado como inactivo)`,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: deletedUser,
    });
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);

    await logAudit({
      userId: context.userId,
      action: 'error_delete_user',
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
