// components/admin-dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Users, Trees, Activity, TrendingUp, Download, Loader2, Shield, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

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
          <TabsTrigger value="roles">Roles</TabsTrigger>
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

        <TabsContent value="roles">
          <AdminRolesTable />
        </TabsContent>

        <TabsContent value="auditoria">
          <AdminAuditTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Tabla de Usuarios - COMPLETO CRUD (RF-031)
function AdminUsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');
  const [newStatus, setNewStatus] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [formData, setFormData] = useState({ nombre: '', apellido: '', email: '', telefono: '', contrasena: '' });
  const [updatingRole, setUpdatingRole] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users?limit=100');
      
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

  const handleOpenRoleDialog = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.rol === 'ADMIN' ? 'ADMIN' : 'USER');
    setShowRoleDialog(true);
  };

  const handleOpenStatusDialog = (user: any) => {
    setSelectedUser(user);
    setNewStatus(user.estado === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO');
    setShowStatusDialog(true);
  };

  const handleOpenCreateDialog = () => {
    setFormData({ nombre: '', apellido: '', email: '', telefono: '', contrasena: '' });
    setShowCreateDialog(true);
  };

  const handleOpenEditDialog = (user: any) => {
    setSelectedUser(user);
    setFormData({ nombre: user.nombre, apellido: user.apellido, email: user.email, telefono: user.telefono || '', contrasena: '' });
    setShowEditDialog(true);
  };

  const handleOpenDeleteDialog = (user: any) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || newRole === selectedUser.rol) {
      toast({
        title: 'Error',
        description: 'Selecciona un rol diferente al actual',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, rol: newRole } : u
      ));

      setShowRoleDialog(false);
      setSelectedUser(null);

      toast({
        title: 'Éxito',
        description: `Rol de ${selectedUser.nombre} actualizado a ${newRole}`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error updating role:', errorMsg);
      toast({
        title: 'Error al cambiar rol',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedUser || newStatus === selectedUser.estado) {
      toast({
        title: 'Error',
        description: 'Selecciona un estado diferente al actual',
        variant: 'destructive',
      });
      return;
    }

    // Validación: No desactivar al último admin activo
    if (newStatus === 'INACTIVO' && selectedUser.rol === 'ADMIN') {
      const activeAdmins = users.filter(u => u.rol === 'ADMIN' && u.estado === 'ACTIVO');
      if (activeAdmins.length === 1) {
        toast({
          title: 'No permitido',
          description: 'No puedes desactivar al único administrador activo del sistema',
          variant: 'destructive',
        });
        return;
      }
    }

    setUpdatingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: selectedUser.nombre,
          apellido: selectedUser.apellido,
          email: selectedUser.email,
          telefono: selectedUser.telefono,
          estado: newStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setUsers(users.map(u => u.id === selectedUser.id ? data.data : u));

      toast({
        title: 'Éxito',
        description: `Usuario ${selectedUser.nombre} ${selectedUser.apellido} ${newStatus === 'ACTIVO' ? 'activado' : 'desactivado'} correctamente`,
      });
      setShowStatusDialog(false);
      setSelectedUser(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error updating status:', errorMsg);
      toast({
        title: 'Error al cambiar estado',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim() || !formData.contrasena) {
      toast({
        title: 'Error',
        description: 'Nombre, apellido, email y contraseña son requeridos',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim() || undefined,
          contrasena: formData.contrasena,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setUsers([...users, data.data]);
      setShowCreateDialog(false);
      setFormData({ nombre: '', apellido: '', email: '', telefono: '', contrasena: '' });

      toast({
        title: 'Éxito',
        description: `Usuario ${formData.nombre} ${formData.apellido} creado exitosamente`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al crear usuario',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim()) {
      toast({
        title: 'Error',
        description: 'Nombre, apellido y email son requeridos',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setUsers(users.map(u => u.id === selectedUser.id ? data.data : u));
      setShowEditDialog(false);
      setSelectedUser(null);

      toast({
        title: 'Éxito',
        description: `Usuario actualizado exitosamente`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al editar usuario',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      setUsers(users.filter(u => u.id !== selectedUser.id));
      setShowDeleteDialog(false);
      setSelectedUser(null);

      toast({
        title: 'Éxito',
        description: `Usuario eliminado exitosamente`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al eliminar usuario',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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
          <CardDescription>Gestión completa de usuarios</CardDescription>
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usuarios del Sistema</CardTitle>
            <CardDescription>Gestiona usuarios, cambia roles y elimina cuentas</CardDescription>
          </div>
          <Button onClick={handleOpenCreateDialog} className="gap-2">
            <Users className="w-4 h-4" />
            Crear Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay usuarios</p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium">{user.nombre} {user.apellido}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.telefono && <p className="text-xs text-muted-foreground">Tel: {user.telefono}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={user.rol === 'ADMIN' ? 'default' : 'secondary'} className="flex items-center gap-1">
                      {user.rol === 'ADMIN' && <Shield className="w-3 h-3" />}
                      {user.rol}
                    </Badge>
                    <Badge variant={user.estado === 'ACTIVO' ? 'default' : 'destructive'} className="text-xs">
                      {user.estado}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenRoleDialog(user)}
                      className="text-xs"
                    >
                      Rol
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenStatusDialog(user)}
                      className="text-xs"
                    >
                      Estado
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditDialog(user)}
                      className="text-xs"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleOpenDeleteDialog(user)}
                      className="text-xs"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para cambiar rol */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Actualiza el rol para <strong>{selectedUser?.nombre} {selectedUser?.apellido}</strong> ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 p-3 bg-accent rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Rol Actual</p>
                <Badge variant={selectedUser?.rol === 'ADMIN' ? 'default' : 'secondary'}>
                  {selectedUser?.rol}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <Badge variant={selectedUser?.estado === 'ACTIVO' ? 'default' : 'destructive'}>
                  {selectedUser?.estado}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-select">Nuevo Rol</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as 'USER' | 'ADMIN')}>
                <SelectTrigger id="role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">👤 Usuario Regular - Sin acceso al panel admin</SelectItem>
                  <SelectItem value="ADMIN">👑 Administrador - Acceso completo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedUser?.rol === 'ADMIN' && newRole === 'USER' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ <strong>Advertencia:</strong> Estás degradando a un administrador. Asegúrate de que haya otro admin activo en el sistema.
                </AlertDescription>
              </Alert>
            )}

            {selectedUser?.rol === 'USER' && newRole === 'ADMIN' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ✓ {selectedUser?.nombre} {selectedUser?.apellido} tendrá acceso completo al panel administrativo y a todas las funciones de gestión.
                </AlertDescription>
              </Alert>
            )}

            {selectedUser?.rol === 'ADMIN' && newRole === 'ADMIN' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  El rol ya es administrador. Selecciona un rol diferente para hacer cambios.
                </AlertDescription>
              </Alert>
            )}

            {selectedUser?.rol === 'USER' && newRole === 'USER' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  El rol ya es usuario regular. Selecciona un rol diferente para hacer cambios.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleChangeRole} 
              disabled={updatingRole || newRole === selectedUser?.rol}
              variant={selectedUser?.rol === 'ADMIN' && newRole === 'USER' ? 'destructive' : 'default'}
              className="gap-2"
            >
              {updatingRole && <Loader2 className="h-4 w-4 animate-spin" />}
              {updatingRole 
                ? 'Actualizando...' 
                : newRole === 'ADMIN' 
                  ? 'Promover a Administrador'
                  : 'Degradar a Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para cambiar estado del usuario */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Usuario</DialogTitle>
            <DialogDescription>
              Actualiza el estado para <strong>{selectedUser?.nombre} {selectedUser?.apellido}</strong> ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 p-3 bg-accent rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Estado Actual</p>
                <Badge variant={selectedUser?.estado === 'ACTIVO' ? 'default' : 'destructive'}>
                  {selectedUser?.estado}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rol</p>
                <Badge variant={selectedUser?.rol === 'ADMIN' ? 'default' : 'secondary'}>
                  {selectedUser?.rol}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-select">Nuevo Estado</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as 'ACTIVO' | 'INACTIVO')}>
                <SelectTrigger id="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">✓ Activo - Puede acceder a su cuenta</SelectItem>
                  <SelectItem value="INACTIVO">✗ Inactivo - No podrá acceder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'INACTIVO' && selectedUser?.rol === 'ADMIN' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ <strong>Advertencia:</strong> Estás desactivando a un administrador. Asegúrate de que haya otro admin activo.
                </AlertDescription>
              </Alert>
            )}

            {newStatus === 'INACTIVO' && selectedUser?.rol !== 'ADMIN' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {selectedUser?.nombre} {selectedUser?.apellido} no podrá acceder a su cuenta ni realizar ninguna acción en el sistema.
                </AlertDescription>
              </Alert>
            )}

            {newStatus === 'ACTIVO' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {selectedUser?.nombre} {selectedUser?.apellido} podrá volver a acceder a su cuenta.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleChangeStatus} 
              disabled={updatingRole || newStatus === selectedUser?.estado}
              variant={newStatus === 'INACTIVO' ? 'destructive' : 'default'}
              className="gap-2"
            >
              {updatingRole && <Loader2 className="h-4 w-4 animate-spin" />}
              {updatingRole 
                ? 'Actualizando...' 
                : newStatus === 'ACTIVO' 
                  ? 'Activar Usuario' 
                  : 'Desactivar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear usuario */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>Ingresa los datos del nuevo usuario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="create-nombre">Nombre *</Label>
                <Input
                  id="create-nombre"
                  placeholder="Ej: Juan"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-apellido">Apellido *</Label>
                <Input
                  id="create-apellido"
                  placeholder="Ej: Pérez"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="Ej: juan@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-telefono">Teléfono</Label>
              <Input
                id="create-telefono"
                placeholder="Ej: +51 999 123 456"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-pass">Contraseña Temporal *</Label>
              <Input
                id="create-pass"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.contrasena}
                onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateUser} 
              disabled={submitting}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar usuario */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Actualiza los datos del usuario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-apellido">Apellido *</Label>
                <Input
                  id="edit-apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input
                id="edit-telefono"
                placeholder="Ej: +51 999 123 456"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditUser} 
              disabled={submitting}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para eliminar usuario */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">⚠️ Eliminar Usuario</DialogTitle>
            <DialogDescription>Esta acción marcará al usuario como inactivo (no se eliminan datos)</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-accent rounded-lg">
              <p className="font-medium">{selectedUser?.nombre} {selectedUser?.apellido}</p>
              <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              {selectedUser?.rol === 'ADMIN' && (
                <Badge variant="default" className="mt-2">Administrador</Badge>
              )}
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> El usuario será marcado como <strong>INACTIVO</strong>. No podrá acceder a su cuenta, pero todos sus datos (árboles, seguimientos, fotos) serán preservados en el sistema.
              </AlertDescription>
            </Alert>

            {selectedUser?.rol === 'ADMIN' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ <strong>Advertencia:</strong> Estás desactivando a un administrador. Asegúrate de que haya otro admin activo en el sistema.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Si cambias de opinión, puedes reactivar este usuario desde la sección de "Estado" en cualquier momento.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser} 
              disabled={submitting}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Desactivando...' : 'Sí, Desactivar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Tabla de Roles - GESTIÓN COMPLETA DE ROLES (RF-032)
function AdminRolesTable() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({ rol: '', descripcion: '' });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/roles');
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      setRoles(data.data);
      setError(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error fetching roles:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setFormData({ rol: '', descripcion: '' });
    setShowCreateDialog(true);
  };

  const handleOpenEditDialog = (role: any) => {
    setSelectedRole(role);
    setFormData({ rol: role.rol, descripcion: role.descripcion || '' });
    setShowEditDialog(true);
  };

  const handleOpenDeleteDialog = (role: any) => {
    setSelectedRole(role);
    setShowDeleteDialog(true);
  };

  const handleCreateRole = async () => {
    if (!formData.rol.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del rol es requerido',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol: formData.rol.trim(),
          descripcion: formData.descripcion.trim(),
          permisos: {
            tree: ['read_own'],
            user: ['read_own'],
            admin: [],
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setRoles([...roles, data.data]);
      setShowCreateDialog(false);
      setFormData({ rol: '', descripcion: '' });

      toast({
        title: 'Éxito',
        description: `Rol ${formData.rol} creado exitosamente`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al crear rol',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = async () => {
    if (!formData.descripcion.trim()) {
      toast({
        title: 'Error',
        description: 'La descripción es requerida',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: formData.descripcion.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setRoles(roles.map(r => r.id === selectedRole.id ? data.data : r));
      setShowEditDialog(false);
      setSelectedRole(null);

      toast({
        title: 'Éxito',
        description: `Rol actualizado exitosamente`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al editar rol',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      setRoles(roles.filter(r => r.id !== selectedRole.id));
      setShowDeleteDialog(false);
      setSelectedRole(null);

      toast({
        title: 'Éxito',
        description: `Rol eliminado exitosamente`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al eliminar rol',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando roles...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Roles del Sistema</CardTitle>
          <CardDescription>Gestión de roles y permisos</CardDescription>
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

  // Separar roles predefinidos de personalizados
  const predefinedRoles = roles.filter(r => ['USER', 'ADMIN'].includes(r.rol));
  const customRoles = roles.filter(r => !['USER', 'ADMIN'].includes(r.rol));

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Roles del Sistema</CardTitle>
            <CardDescription>Crea y gestiona roles personalizados</CardDescription>
          </div>
          <Button onClick={handleOpenCreateDialog} className="gap-2">
            <Shield className="w-4 h-4" />
            Crear Rol
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Roles predefinidos */}
          {predefinedRoles.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Roles Predefinidos del Sistema</h3>
              <div className="space-y-2">
                {predefinedRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{role.rol}</p>
                      <p className="text-sm text-muted-foreground">{role.descripcion || 'Rol del sistema'}</p>
                    </div>
                    <Badge variant="secondary">Sistema</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roles personalizados */}
          {customRoles.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Roles Personalizados</h3>
              <div className="space-y-2">
                {customRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{role.rol}</p>
                      <p className="text-sm text-muted-foreground">{role.descripcion || 'Sin descripción'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditDialog(role)}
                        className="text-xs"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleOpenDeleteDialog(role)}
                        className="text-xs"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customRoles.length === 0 && predefinedRoles.length > 0 && (
            <p className="text-muted-foreground text-center py-8 text-sm">No hay roles personalizados. ¡Crea uno!</p>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear rol */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Rol</DialogTitle>
            <DialogDescription>Define un nuevo rol con permisos personalizados</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-rol">Nombre del Rol</Label>
              <Input
                id="create-rol"
                placeholder="Ej: ESPECIALISTA, MODERADOR"
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value.toUpperCase() })}
              />
              <p className="text-xs text-muted-foreground">Solo letras, números, guiones y guiones bajos</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-desc">Descripción</Label>
              <Input
                id="create-desc"
                placeholder="Describe qué hace este rol"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateRole} 
              disabled={submitting}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Creando...' : 'Crear Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar rol */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Rol</DialogTitle>
            <DialogDescription>Actualiza la información del rol</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-rol">Nombre del Rol</Label>
              <Input
                id="edit-rol"
                disabled
                value={formData.rol}
              />
              <p className="text-xs text-muted-foreground">El nombre no puede cambiarse</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Descripción</Label>
              <Input
                id="edit-desc"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditRole} 
              disabled={submitting}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para eliminar rol */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Rol</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer</DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ¿Estás seguro de que deseas eliminar el rol <strong>{selectedRole?.rol}</strong>? Solo es posible si ningún usuario lo tiene asignado.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteRole} 
              disabled={submitting}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Eliminando...' : 'Confirmar Eliminación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminAuditTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  
  // Paginación
  const logsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtros
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  // Aplicar filtros cada vez que cambia alguno
  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset a página 1 cuando filtran
  }, [logs, filterUser, filterAction, filterDateFrom, filterDateTo]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/logs?limit=100');
      
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

  const applyFilters = () => {
    let filtered = logs;

    // Filtro por usuario (busca en usuario_id, email, nombre o apellido)
    if (filterUser) {
      filtered = filtered.filter(log =>
        log.usuario_id?.toString().includes(filterUser.toLowerCase()) ||
        log.usuario_email?.toLowerCase().includes(filterUser.toLowerCase()) ||
        log.usuario_nombre?.toLowerCase().includes(filterUser.toLowerCase()) ||
        log.usuario_apellido?.toLowerCase().includes(filterUser.toLowerCase())
      );
    }

    // Filtro por acción
    if (filterAction) {
      filtered = filtered.filter(log =>
        log.accion?.toLowerCase().includes(filterAction.toLowerCase())
      );
    }

    // Filtro por fecha desde
    if (filterDateFrom) {
      const dateFrom = new Date(filterDateFrom);
      filtered = filtered.filter(log => new Date(log.fecha_creacion) >= dateFrom);
    }

    // Filtro por fecha hasta
    if (filterDateTo) {
      const dateTo = new Date(filterDateTo);
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.fecha_creacion) <= dateTo);
    }

    setFilteredLogs(filtered);
  };

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      alert('No hay registros para exportar');
      return;
    }

    setExportingCsv(true);
    try {
      // Preparar encabezados
      const headers = ['ID', 'Usuario ID', 'Nombre', 'Apellido', 'Email', 'Acción', 'Recurso', 'Recurso ID', 'Fecha', 'IP', 'Detalles'];
      
      // Preparar filas
      const rows = filteredLogs.map(log => [
        log.id,
        log.usuario_id,
        log.usuario_nombre || 'N/A',
        log.usuario_apellido || 'N/A',
        log.usuario_email || 'N/A',
        log.accion,
        log.recurso,
        log.recurso_id || 'N/A',
        new Date(log.fecha_creacion).toLocaleString('es-PE'),
        log.ip || 'N/A',
        log.detalles || 'N/A',
      ]);

      // Crear CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error al exportar CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  const clearFilters = () => {
    setFilterUser('');
    setFilterAction('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  // Paginación
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIdx = (currentPage - 1) * logsPerPage;
  const paginatedLogs = filteredLogs.slice(startIdx, startIdx + logsPerPage);

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
        <CardDescription>Últimas acciones registradas en el sistema • Filtra y exporta logs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-muted rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="filter-user" className="text-xs">Usuario/Email</Label>
            <Input
              id="filter-user"
              placeholder="Buscar por usuario..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-action" className="text-xs">Acción</Label>
            <Input
              id="filter-action"
              placeholder="Ej: update_user_role"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-date-from" className="text-xs">Desde</Label>
            <Input
              id="filter-date-from"
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-date-to" className="text-xs">Hasta</Label>
            <Input
              id="filter-date-to"
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Botones de acciones */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={clearFilters}
            disabled={!filterUser && !filterAction && !filterDateFrom && !filterDateTo}
          >
            Limpiar Filtros
          </Button>
          <Button
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0 || exportingCsv}
            className="gap-2"
          >
            {exportingCsv ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exportingCsv ? 'Exportando...' : `Exportar CSV (${filteredLogs.length})`}
          </Button>
        </div>

        {/* Logs - LIMITADO A 15 POR PÁGINA */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto border rounded-lg p-3">
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {logs.length === 0 ? 'No hay registros' : 'No hay registros que coincidan con los filtros'}
            </p>
          ) : (
            paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border rounded-lg text-sm hover:bg-accent/50 transition"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{log.accion}</p>
                    <Badge variant="outline" className="text-xs">{log.recurso}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {log.detalles || `${log.usuario_nombre} ${log.usuario_apellido} • ${log.usuario_email}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.fecha_creacion).toLocaleString('es-PE')} • {log.ip || 'Sin IP'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <p className="text-muted-foreground">
              Mostrando {paginatedLogs.length} de {filteredLogs.length} registros
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← Anterior
              </Button>
              <Button size="sm" variant="ghost" disabled>
                Página {currentPage} de {totalPages}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
