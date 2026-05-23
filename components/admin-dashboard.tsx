// components/admin-dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Users, Trees, Activity, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DashboardStats {
  usuarios: {
    total: number;
    admins: number;
  };
  arboles: {
    total: number;
    saludables: number;
  };
  seguimientos: {
    total: number;
  };
  auditoria: {
    logs_semana: number;
    usuarios_activos: number;
  };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/dashboard');

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setStats(data.data);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error en AdminDashboard:', errorMsg);
      setError(errorMsg);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No hay datos disponibles</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usuarios.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.usuarios.admins} administradores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Árboles Registrados</CardTitle>
            <Trees className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.arboles.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.arboles.saludables} en excelente estado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seguimientos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.seguimientos.total}</div>
            <p className="text-xs text-muted-foreground">Total en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad (7d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.auditoria.logs_semana}</div>
            <p className="text-xs text-muted-foreground">
              {stats.auditoria.usuarios_activos} usuarios activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumen" className="w-full">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General del Sistema</CardTitle>
              <CardDescription>Estado actual y métricas clave</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tasa de Admins</p>
                  <p className="text-lg font-semibold">
                    {stats.usuarios.total > 0
                      ? ((stats.usuarios.admins / stats.usuarios.total) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Árb. Saludables</p>
                  <p className="text-lg font-semibold">
                    {stats.arboles.total > 0
                      ? ((stats.arboles.saludables / stats.arboles.total) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <AdminUsersTable />
        </TabsContent>

        <TabsContent value="auditoria">
          <AdminAuditTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Tabla de Usuarios
function AdminUsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users?limit=10');
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      setUsers(data.data);
      setError(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error fetching users:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando usuarios...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>Últimos 10 usuarios registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios del Sistema</CardTitle>
        <CardDescription>Últimos 10 usuarios registrados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay usuarios</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.nombre}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant={user.rol === 'ADMIN' ? 'default' : 'secondary'}>
                  {user.rol}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Tabla de Auditoría
function AdminAuditTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/logs?limit=10');
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      setLogs(data.data);
      setError(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error fetching logs:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando logs...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Log de Auditoría</CardTitle>
          <CardDescription>Últimas acciones registradas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log de Auditoría</CardTitle>
        <CardDescription>Últimas acciones registradas en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay registros</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border rounded-lg text-sm"
              >
                <div>
                  <p className="font-medium">{log.accion}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.fecha_creacion).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{log.recurso}</Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
