// app/api/admin/dashboard/route.ts
/**
 * GET /api/admin/dashboard
 * Retorna estadísticas enriquecidas del sistema con predicciones, tendencias e histórico
 * Solo accesible para administradores
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute, logAudit } from '@/lib/role-guards';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  // Verificar que el usuario sea admin
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) {
    return response!;
  }

  try {
    // Obtener estadísticas actuales y datos históricos
    const [
      usuariosResult,
      arbolesResult,
      seguimientosResult,
      auditResult,
      usuariosHistoricoResult,
      arbolesHistoricoResult,
      arbolSaludResult,
      seguimientosHistoricoResult,
    ] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(CASE WHEN rol = $1 THEN 1 END) as admins FROM usuarios', ['ADMIN']),
      query('SELECT COUNT(*) as total FROM arboles'),
      query('SELECT COUNT(*) as total FROM seguimientos'),
      query('SELECT COUNT(*) as total_logs, COUNT(DISTINCT usuario_id) as usuarios_activos FROM logs_auditoria WHERE fecha_creacion > NOW() - INTERVAL \'7 days\''),
      // Histórico de usuarios por día (últimos 30 días)
      query(`
        SELECT 
          DATE(fecha_registro)::text as fecha,
          COUNT(*) as total,
          COUNT(CASE WHEN rol = 'ADMIN' THEN 1 END) as admins
        FROM usuarios
        WHERE fecha_registro > NOW() - INTERVAL '30 days'
        GROUP BY DATE(fecha_registro)
        ORDER BY DATE(fecha_registro)
      `),
      // Histórico de árboles por día (últimos 30 días)
      query(`
        SELECT 
          DATE(creado_en)::text as fecha,
          COUNT(*) as total
        FROM arboles
        WHERE creado_en > NOW() - INTERVAL '30 days'
        GROUP BY DATE(creado_en)
        ORDER BY DATE(creado_en)
      `),
      // Salud de árboles (desde seguimientos)
      query(`
        SELECT 
          COALESCE(s.salud, 'sin_dato') as estado,
          COUNT(*) as cantidad
        FROM seguimientos s
        WHERE s.fecha_seguimiento > NOW() - INTERVAL '30 days'
        GROUP BY COALESCE(s.salud, 'sin_dato')
      `),
      // Histórico de seguimientos por día (últimos 30 días)
      query(`
        SELECT 
          DATE(creado_en)::text as fecha,
          COUNT(*) as total
        FROM seguimientos
        WHERE creado_en > NOW() - INTERVAL '30 days'
        GROUP BY DATE(creado_en)
        ORDER BY DATE(creado_en)
      `),
    ]);

    // Calcular tendencias y predicciones
    const usuariosTotal = parseInt(usuariosResult.rows[0]?.total || 0);
    const usuariosAdmins = parseInt(usuariosResult.rows[0]?.admins || 0);
    
    // Obtener datos históricos de usuarios
    const usuariosHistorico = usuariosHistoricoResult.rows.map((row: any) => ({
      fecha: row.fecha,
      total: parseInt(row.total),
      admins: parseInt(row.admins),
    }));

    // Calcular crecimiento de usuarios
    const usuariosCrecimientoSemanales = usuariosHistorico.slice(-7);
    const usuariosTendencia = usuariosCrecimientoSemanales.length > 1 
      ? (((usuariosCrecimientoSemanales[usuariosCrecimientoSemanales.length - 1]?.total || 0) - 
         (usuariosCrecimientoSemanales[0]?.total || 0)) / 
        Math.max(1, (usuariosCrecimientoSemanales[0]?.total || 1))) * 100 
      : 0;

    // Predicción de usuarios (proyección lineal simple para próximos 30 días)
    const usuariosCrecimientoPromedio = usuariosTendencia / 7; // promedio diario
    const usuarioPrediccion = Array.from({ length: 30 }, (_, i) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + i + 1);
      return {
        fecha: fecha.toISOString().split('T')[0],
        prediccion: Math.round(usuariosTotal + (usuariosCrecimientoPromedio * (i + 1))),
      };
    });

    // Datos de árboles
    const arbolesTotal = parseInt(arbolesResult.rows[0]?.total || 0);
    const arbolesHistorico = arbolesHistoricoResult.rows.map((row: any) => ({
      fecha: row.fecha,
      total: parseInt(row.total),
    }));

    // Salud de árboles
    const salud: any = {};
    arbolSaludResult.rows.forEach((row: any) => {
      salud[row.estado] = parseInt(row.cantidad);
    });

    // Total de árboles saludables (última entrada de salud o Excelente)
    const arbolSaludable = salud['Excelente'] || 0;

    // Predicción de árboles
    const arbolCrecimientoSemanales = arbolesHistorico.slice(-7);
    const arbolTendencia = arbolCrecimientoSemanales.length > 1 
      ? (((arbolCrecimientoSemanales[arbolCrecimientoSemanales.length - 1]?.total || 0) - 
         (arbolCrecimientoSemanales[0]?.total || 0)) / 
        Math.max(1, (arbolCrecimientoSemanales[0]?.total || 1))) * 100 
      : 0;

    const arbolCrecimientoPromedio = arbolTendencia / 7;
    const arbolPrediccion = Array.from({ length: 30 }, (_, i) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + i + 1);
      return {
        fecha: fecha.toISOString().split('T')[0],
        prediccion: Math.round(arbolesTotal + (arbolCrecimientoPromedio * (i + 1))),
      };
    });

    // Seguimientos
    const seguimientosTotal = parseInt(seguimientosResult.rows[0]?.total || 0);
    const seguimientosHistorico = seguimientosHistoricoResult.rows.map((row: any) => ({
      fecha: row.fecha,
      total: parseInt(row.total),
    }));

    // Cálculo de métricas de auditoría
    const logsSemanales = parseInt(auditResult.rows[0]?.total_logs || 0);
    const usuariosActivos = parseInt(auditResult.rows[0]?.usuarios_activos || 0);

    const stats = {
      usuarios: {
        total: usuariosTotal,
        admins: usuariosAdmins,
        porcentajeAdmins: usuariosTotal > 0 ? ((usuariosAdmins / usuariosTotal) * 100).toFixed(1) : 0,
        tendencia: usuariosTendencia.toFixed(1),
        histórico: usuariosHistorico,
        predicción: usuarioPrediccion,
      },
      arboles: {
        total: arbolesTotal,
        salud,
        saludables: arbolSaludable,
        tendencia: arbolTendencia.toFixed(1),
        histórico: arbolesHistorico,
        predicción: arbolPrediccion,
      },
      seguimientos: {
        total: seguimientosTotal,
        histórico: seguimientosHistorico,
      },
      auditoria: {
        logs_semana: logsSemanales,
        usuarios_activos: usuariosActivos,
      },
      resumen: {
        tasa_crecimiento_usuarios: usuariosTendencia.toFixed(1),
        tasa_crecimiento_arboles: arbolTendencia.toFixed(1),
        proyección_usuarios_30d: usuarioPrediccion[29]?.prediccion || usuariosTotal,
        proyección_arboles_30d: arbolPrediccion[29]?.prediccion || arbolesTotal,
      },
    };

    // Registrar acceso al dashboard
    await logAudit({
      userId: context.userId,
      action: 'view_admin_dashboard',
      resource: 'admin',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: stats,
    });
  } catch (error) {
    console.error('❌ Error obteniendo dashboard:', error);

    await logAudit({
      userId: context.userId,
      action: 'error_admin_dashboard',
      resource: 'admin',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      details: error instanceof Error ? error.message : 'Error desconocido',
      statusCode: 500,
    });

    return NextResponse.json(
      { error: 'Error obteniendo estadísticas del dashboard' },
      { status: 500 }
    );
  }
}
