// app/api/admin/roles/route.ts
/**
 * GET /api/admin/roles - Obtiene todos los roles personalizados
 * POST /api/admin/roles - Crea un nuevo rol
 * Solo accesible para administradores
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute, logAudit, getRoles, createRole } from '@/lib/role-guards';

export async function GET(req: NextRequest) {
  // Verificar que el usuario sea admin
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) {
    return response!;
  }

  try {
    const roles = await getRoles();

    // Registrar acceso en auditoría
    await logAudit({
      userId: context.userId,
      action: 'view_roles',
      resource: 'admin',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('❌ Error obteniendo roles:', error);

    await logAudit({
      userId: context.userId,
      action: 'error_view_roles',
      resource: 'admin',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      details: error instanceof Error ? error.message : 'Error desconocido',
      statusCode: 500,
    });

    return NextResponse.json(
      { error: 'Error obteniendo roles' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Verificar que el usuario sea admin
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) {
    return response!;
  }

  try {
    const { rol, descripcion, permisos } = await req.json();

    // Validaciones
    if (!rol || rol.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre del rol es requerido' },
        { status: 400 }
      );
    }

    if (!permisos || typeof permisos !== 'object') {
      return NextResponse.json(
        { error: 'Los permisos deben ser un objeto válido' },
        { status: 400 }
      );
    }

    // Validar que el nombre del rol no contenga caracteres especiales
    if (!/^[a-zA-Z0-9_-]+$/.test(rol)) {
      return NextResponse.json(
        { error: 'El nombre del rol solo puede contener letras, números, guiones y guiones bajos' },
        { status: 400 }
      );
    }

    // Crear rol
    const newRole = await createRole({
      rol: rol.trim().toUpperCase(),
      descripcion: descripcion?.trim() || null,
      permisos,
    });

    // Registrar en auditoría
    await logAudit({
      userId: context.userId,
      action: 'create_role',
      resource: 'admin',
      resourceId: newRole.id,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      details: `Nuevo rol creado: ${newRole.rol}`,
      statusCode: 201,
      changesAfter: {
        rol: newRole.rol,
        descripcion: newRole.descripcion,
        permisos: newRole.permisos,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Rol creado exitosamente',
        data: newRole,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creando rol:', error);

    await logAudit({
      userId: context.userId,
      action: 'error_create_role',
      resource: 'admin',
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
