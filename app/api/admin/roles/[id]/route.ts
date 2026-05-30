// app/api/admin/roles/[id]/route.ts
/**
 * PUT /api/admin/roles/[id] - Edita un rol existente
 * DELETE /api/admin/roles/[id] - Elimina un rol
 * Solo accesible para administradores
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute, logAudit, updateRole, deleteRole, getRoles } from '@/lib/role-guards';

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
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'ID de rol inválido' },
        { status: 400 }
      );
    }

    const { descripcion, permisos } = await req.json();

    // Al menos un campo debe ser proporcionado
    if (descripcion === undefined && !permisos) {
      return NextResponse.json(
        { error: 'Al menos un campo debe ser proporcionado para actualizar' },
        { status: 400 }
      );
    }

    if (permisos && typeof permisos !== 'object') {
      return NextResponse.json(
        { error: 'Los permisos deben ser un objeto válido' },
        { status: 400 }
      );
    }

    // Obtener rol antes de cambiar
    const roles = await getRoles();
    const roleBefore = roles.find(r => r.id === roleId);

    if (!roleBefore) {
      return NextResponse.json(
        { error: 'Rol no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar rol
    const updatedRole = await updateRole(roleId, {
      descripcion: descripcion !== undefined ? descripcion?.trim() || null : undefined,
      permisos: permisos || undefined,
    });

    if (!updatedRole) {
      throw new Error('Error al actualizar rol');
    }

    // Registrar en auditoría
    await logAudit({
      userId: context.userId,
      action: 'update_role',
      resource: 'admin',
      resourceId: roleId,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      changesBefore: {
        descripcion: roleBefore.descripcion,
        permisos: roleBefore.permisos,
      },
      changesAfter: {
        descripcion: updatedRole.descripcion,
        permisos: updatedRole.permisos,
      },
      details: `Rol ${roleBefore.rol} actualizado`,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: updatedRole,
    });
  } catch (error) {
    console.error('❌ Error actualizando rol:', error);

    await logAudit({
      userId: context.userId,
      action: 'error_update_role',
      resource: 'admin',
      resourceId: roleId,
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

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  // Verificar que el usuario sea admin
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) {
    return response!;
  }

  try {
    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'ID de rol inválido' },
        { status: 400 }
      );
    }

    // Obtener rol antes de eliminar
    const roles = await getRoles();
    const roleBefore = roles.find(r => r.id === roleId);

    if (!roleBefore) {
      return NextResponse.json(
        { error: 'Rol no encontrado' },
        { status: 404 }
      );
    }

    // No permitir eliminar roles predefinidos
    const predefinedRoles = ['USER', 'ADMIN'];
    if (predefinedRoles.includes(roleBefore.rol)) {
      return NextResponse.json(
        { error: 'No se pueden eliminar roles predefinidos del sistema' },
        { status: 400 }
      );
    }

    // Eliminar rol
    const deletedRole = await deleteRole(roleId);

    // Registrar en auditoría
    await logAudit({
      userId: context.userId,
      action: 'delete_role',
      resource: 'admin',
      resourceId: roleId,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      changesBefore: {
        rol: roleBefore.rol,
        descripcion: roleBefore.descripcion,
      },
      details: `Rol ${roleBefore.rol} eliminado`,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      message: 'Rol eliminado exitosamente',
      data: deletedRole,
    });
  } catch (error) {
    console.error('❌ Error eliminando rol:', error);

    await logAudit({
      userId: context.userId,
      action: 'error_delete_role',
      resource: 'admin',
      resourceId: roleId,
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
