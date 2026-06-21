// components/admin-dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Users, Trees, Activity, TrendingUp, Download, Loader2, Shield, ChevronDown, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardStats {
  usuarios: {
    total: number;
    admins: number;
    porcentajeAdmins: string | number;
    tendencia: string | number;
    histórico: Array<{ fecha: string; total: number; admins: number }>;
    predicción: Array<{ fecha: string; prediccion: number }>;
  };
  arboles: {
    total: number;
    salud: Record<string, number>;
    saludables: number;
    tendencia: string | number;
    histórico: Array<{ fecha: string; total: number }>;
    predicción: Array<{ fecha: string; prediccion: number }>;
  };
  seguimientos: {
    total: number;
    histórico: Array<{ fecha: string; total: number }>;
  };
  auditoria: {
    logs_semana: number;
    usuarios_activos: number;
  };
  resumen?: {
    tasa_crecimiento_usuarios: string | number;
    tasa_crecimiento_arboles: string | number;
    proyección_usuarios_30d: number;
    proyección_arboles_30d: number;
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

  // Colores para gráficos
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Preparar datos de salud de árboles
  const arbolSaludData = Object.entries(stats.arboles.salud).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
    value: typeof value === 'number' ? value : 0,
  }));

  // Predicción: últimos 30 días de usuarios
  const usuarioPredicciónData = stats.usuarios.predicción?.slice(0, 15) || [];
  
  // Predicción: últimos 30 días de árboles
  const arbolPredicciónData = stats.arboles.predicción?.slice(0, 15) || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards - Mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Usuarios */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <div className="absolute inset-0 opacity-5 bg-grid-pattern" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <div className="p-2 bg-blue-200/50 dark:bg-blue-800/50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.usuarios.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200">
                {stats.usuarios.admins} admins
              </Badge>
              <div className={`flex items-center gap-1 text-xs font-semibold ${parseFloat(String(stats.usuarios.tendencia)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(String(stats.usuarios.tendencia)) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(parseFloat(String(stats.usuarios.tendencia)))}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Árboles */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <div className="absolute inset-0 opacity-5 bg-grid-pattern" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Árboles Registrados</CardTitle>
            <div className="p-2 bg-green-200/50 dark:bg-green-800/50 rounded-lg">
              <Trees className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.arboles.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200">
                {stats.arboles.saludables} saludables
              </Badge>
              <div className={`flex items-center gap-1 text-xs font-semibold ${parseFloat(String(stats.arboles.tendencia)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(String(stats.arboles.tendencia)) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(parseFloat(String(stats.arboles.tendencia)))}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seguimientos */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <div className="absolute inset-0 opacity-5 bg-grid-pattern" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seguimientos</CardTitle>
            <div className="p-2 bg-amber-200/50 dark:bg-amber-800/50 rounded-lg">
              <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.seguimientos.total}</div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">Registros totales del sistema</p>
          </CardContent>
        </Card>

        {/* Actividad */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <div className="absolute inset-0 opacity-5 bg-grid-pattern" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad (7d)</CardTitle>
            <div className="p-2 bg-purple-200/50 dark:bg-purple-800/50 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.auditoria.logs_semana}</div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">{stats.auditoria.usuarios_activos} usuarios activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Mejoradas */}
      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-muted p-1 rounded-lg">
          <TabsTrigger value="resumen" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">Resumen</TabsTrigger>
          <TabsTrigger value="predicciones" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">Predicciones</TabsTrigger>
          <TabsTrigger value="usuarios" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">Usuarios</TabsTrigger>
          <TabsTrigger value="contenido" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">Contenido</TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">Roles</TabsTrigger>
          <TabsTrigger value="auditoria" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">Auditoría</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="resumen" className="space-y-4">
          {/* Métricas Clave */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Análisis General del Sistema
              </CardTitle>
              <CardDescription>Métricas operacionales y tendencias en tiempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-muted-foreground font-semibold">Tasa Admins</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.usuarios.porcentajeAdmins}%</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700">
                  <p className="text-xs text-muted-foreground font-semibold">Árboles Saludables</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.arboles.total > 0 ? ((stats.arboles.saludables / stats.arboles.total) * 100).toFixed(1) : 0}%</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-700">
                  <p className="text-xs text-muted-foreground font-semibold">Crec. Usuarios (7d)</p>
                  <p className={`text-2xl font-bold mt-1 ${parseFloat(String(stats.usuarios.tendencia)) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {parseFloat(String(stats.usuarios.tendencia)) >= 0 ? '+' : ''}{Number(stats.usuarios.tendencia).toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <p className="text-xs text-muted-foreground font-semibold">Crec. Árboles (7d)</p>
                  <p className={`text-2xl font-bold mt-1 ${parseFloat(String(stats.arboles.tendencia)) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {parseFloat(String(stats.arboles.tendencia)) >= 0 ? '+' : ''}{Number(stats.arboles.tendencia).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráficos: Histórico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Histórico de Usuarios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Usuarios (30 días)</CardTitle>
                <CardDescription>Crecimiento del total de usuarios registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.usuarios.histórico}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" dark-stroke="#374151" />
                    <XAxis dataKey="fecha" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}}
                      formatter={(value: any) => [`${value} usuarios`, 'Total']}
                    />
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Histórico de Árboles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Árboles (30 días)</CardTitle>
                <CardDescription>Crecimiento del total de árboles registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.arboles.histórico}>
                    <defs>
                      <linearGradient id="colorTrees" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" dark-stroke="#374151" />
                    <XAxis dataKey="fecha" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}}
                      formatter={(value: any) => [`${value} árboles`, 'Total']}
                    />
                    <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTrees)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Salud de Árboles */}
          {arbolSaludData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución de Salud de Árboles</CardTitle>
                <CardDescription>Estado actual de los árboles por categoría de salud</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-center justify-between">
                  <div className="w-full lg:w-1/2">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={arbolSaludData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {arbolSaludData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value} árboles`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full lg:w-1/2 space-y-2">
                    {arbolSaludData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Predicciones */}
        <TabsContent value="predicciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                Proyecciones y Predicciones (30 días)
              </CardTitle>
              <CardDescription>Tendencias proyectadas basadas en datos históricos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Predicción Usuarios */}
              <div>
                <h3 className="text-sm font-semibold mb-4 text-blue-600 dark:text-blue-400">Predicción de Usuarios</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usuarioPredicciónData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" dark-stroke="#374151" />
                    <XAxis dataKey="fecha" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}}
                      formatter={(value: any) => [`${value} usuarios`, 'Predicción']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="prediccion" stroke="#3b82f6" name="Proyección" strokeWidth={2} dot={{fill: '#3b82f6', r: 4}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-muted-foreground">Proyección en 30 días:</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.resumen?.proyección_usuarios_30d || stats.usuarios.total} usuarios</p>
                </div>
              </div>

              {/* Predicción Árboles */}
              <div>
                <h3 className="text-sm font-semibold mb-4 text-green-600 dark:text-green-400">Predicción de Árboles</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={arbolPredicciónData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" dark-stroke="#374151" />
                    <XAxis dataKey="fecha" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}}
                      formatter={(value: any) => [`${value} árboles`, 'Predicción']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="prediccion" stroke="#10b981" name="Proyección" strokeWidth={2} dot={{fill: '#10b981', r: 4}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <p className="text-xs text-muted-foreground">Proyección en 30 días:</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.resumen?.proyección_arboles_30d || stats.arboles.total} árboles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Predicciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">¿Cómo se calculan?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Las predicciones se basan en el crecimiento de los últimos 7 días</p>
              <p>✓ Se utiliza una proyección lineal simple para estimar tendencias futuras</p>
              <p>✓ Los datos se actualizan en tiempo real con cada nueva entrada</p>
              <p>✓ Estas proyecciones son estimaciones y pueden variar según la actividad real del sistema</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <AdminUsersTable />
        </TabsContent>

        <TabsContent value="contenido">
          <AdminContentTable />
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
  const [newRole, setNewRole] = useState('USER');
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [formData, setFormData] = useState({ nombre: '', apellido: '', email: '', telefono: '', contrasena: '' });
  const [updatingRole, setUpdatingRole] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchAvailableRoles();
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

  const fetchAvailableRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) return;
      const data = await res.json();
      setAvailableRoles(data.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleOpenRoleDialog = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.rol || 'USER');
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
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>Administra usuarios, roles y permisos del sistema</CardDescription>
          </div>
          <Button onClick={handleOpenCreateDialog} className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
            <Users className="w-4 h-4" />
            + Nuevo Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Usuario</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Rol</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.nombre} {user.apellido}</div>
                        <div className="text-xs text-muted-foreground">{user.telefono || 'Sin teléfono'}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={user.rol === 'ADMIN' ? 'default' : 'secondary'}
                          className={`gap-1 ${user.rol === 'ADMIN' ? 'bg-blue-600' : 'bg-gray-400'}`}
                        >
                          {user.rol === 'ADMIN' && <Shield className="w-3 h-3" />}
                          {user.rol}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.estado === 'ACTIVO' ? 'default' : 'destructive'}>
                          {user.estado === 'ACTIVO' ? '✓ Activo' : '✗ Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Cambiar rol"
                            onClick={() => handleOpenRoleDialog(user)}
                            className="h-8 px-2"
                          >
                            Rol
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Cambiar estado"
                            onClick={() => handleOpenStatusDialog(user)}
                            className="h-8 px-2"
                          >
                            Estado
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Editar"
                            onClick={() => handleOpenEditDialog(user)}
                            className="h-8 px-2"
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Desactivar"
                            onClick={() => handleOpenDeleteDialog(user)}
                            className="h-8 px-2 text-red-600 hover:text-red-700"
                          >
                            Desactivar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-muted-foreground">
              <strong>Total:</strong> {users.length} usuario{users.length !== 1 ? 's' : ''} • 
              <strong className="ml-2">Admins:</strong> {users.filter(u => u.rol === 'ADMIN').length} • 
              <strong className="ml-2">Activos:</strong> {users.filter(u => u.estado === 'ACTIVO').length}
            </p>
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
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles
                    .filter((role) => !['USER', 'ADMIN'].includes(role.rol))
                    .map((role) => (
                      <SelectItem key={role.rol} value={role.rol}>
                        {role.rol} - {role.descripcion || 'Rol personalizado'}
                      </SelectItem>
                    ))}
                  <SelectItem value="USER">👤 Usuario Regular - Sin acceso al panel admin</SelectItem>
                  <SelectItem value="ADMIN">👑 Administrador - Acceso completo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedUser?.rol === 'ADMIN' && newRole !== 'ADMIN' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ <strong>Advertencia:</strong> Estás degradando a un administrador. Asegúrate de que haya otro admin activo en el sistema.
                </AlertDescription>
              </Alert>
            )}

            {selectedUser?.rol !== 'ADMIN' && newRole === 'ADMIN' && (
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
              variant={selectedUser?.rol === 'ADMIN' && newRole !== 'ADMIN' ? 'destructive' : 'default'}
              className="gap-2"
            >
              {updatingRole && <Loader2 className="h-4 w-4 animate-spin" />}
              {updatingRole 
                ? 'Actualizando...' 
                : `Cambiar a ${newRole}`}
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

type PermissionConfig = {
  tree: string[];
  user: string[];
  admin: string[];
};

const DEFAULT_ROLE_PERMISSIONS: PermissionConfig = {
  tree: ['read_own'],
  user: ['read_own'],
  admin: [],
};

const PERMISSION_GROUPS: Array<{
  key: keyof PermissionConfig;
  label: string;
  permissions: Array<{ value: string; label: string }>;
}> = [
  {
    key: 'tree',
    label: 'Árboles',
    permissions: [
      { value: 'create', label: 'Crear' },
      { value: 'read_own', label: 'Ver propios' },
      { value: 'read_all', label: 'Ver todos' },
      { value: 'update_own', label: 'Editar propios' },
      { value: 'delete_own', label: 'Eliminar propios' },
    ],
  },
  {
    key: 'user',
    label: 'Usuarios',
    permissions: [
      { value: 'read_own', label: 'Ver perfil propio' },
      { value: 'read_all', label: 'Ver usuarios' },
      { value: 'update_own', label: 'Editar perfil propio' },
      { value: 'delete_own', label: 'Eliminar propios' },
    ],
  },
  {
    key: 'admin',
    label: 'Administración',
    permissions: [
      { value: 'manage_users', label: 'Gestionar usuarios' },
      { value: 'manage_roles', label: 'Gestionar roles' },
      { value: 'view_audit', label: 'Ver auditoría' },
      { value: 'view_dashboard', label: 'Ver dashboard' },
    ],
  },
];

function clonePermissions(permissions?: Partial<PermissionConfig>): PermissionConfig {
  return {
    tree: [...(permissions?.tree || DEFAULT_ROLE_PERMISSIONS.tree)],
    user: [...(permissions?.user || DEFAULT_ROLE_PERMISSIONS.user)],
    admin: [...(permissions?.admin || DEFAULT_ROLE_PERMISSIONS.admin)],
  };
}

function PermissionEditor({
  value,
  onChange,
}: {
  value: PermissionConfig;
  onChange: (next: PermissionConfig) => void;
}) {
  const togglePermission = (group: keyof PermissionConfig, permission: string, checked: boolean) => {
    const current = value[group] || [];
    onChange({
      ...value,
      [group]: checked
        ? Array.from(new Set([...current, permission]))
        : current.filter((item) => item !== permission),
    });
  };

  return (
    <div className="space-y-3">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.key} className="rounded-lg border p-3">
          <p className="text-sm font-semibold mb-3">{group.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.permissions.map((permission) => (
              <label key={permission.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={value[group.key]?.includes(permission.value)}
                  onCheckedChange={(checked) => togglePermission(group.key, permission.value, checked === true)}
                />
                {permission.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
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
  const [rolePermissions, setRolePermissions] = useState<PermissionConfig>(clonePermissions());
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
    setRolePermissions(clonePermissions());
    setShowCreateDialog(true);
  };

  const handleOpenEditDialog = (role: any) => {
    setSelectedRole(role);
    setFormData({ rol: role.rol, descripcion: role.descripcion || '' });
    setRolePermissions(clonePermissions(role.permisos));
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
          permisos: rolePermissions,
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
          permisos: rolePermissions,
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {Object.values(role.permisos || {}).flat().length} permiso(s)
                      </p>
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {Object.values(role.permisos || {}).flat().length} permiso(s)
                      </p>
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
            <div className="space-y-2">
              <Label>Permisos</Label>
              <PermissionEditor value={rolePermissions} onChange={setRolePermissions} />
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
            <div className="space-y-2">
              <Label>Permisos</Label>
              <PermissionEditor value={rolePermissions} onChange={setRolePermissions} />
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

function AdminContentTable() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'especie',
    nombre: '',
    descripcion: '',
    estado: 'ACTIVO',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/content');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setItems(data.data || []);
      setError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = (tipo: string) => {
    setSelectedItem(null);
    setFormData({ tipo, nombre: '', descripcion: '', estado: 'ACTIVO' });
    setShowFormDialog(true);
  };

  const openEditDialog = (item: any) => {
    setSelectedItem(item);
    setFormData({
      tipo: item.tipo,
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      estado: item.estado || 'ACTIVO',
    });
    setShowFormDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const url = selectedItem ? `/api/admin/content/${selectedItem.id}` : '/api/admin/content';
      const res = await fetch(url, {
        method: selectedItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: formData.tipo,
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          estado: formData.estado,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setItems((current) =>
        selectedItem
          ? current.map((item) => (item.id === selectedItem.id ? { ...item, ...data.data } : item))
          : [...current, { ...data.data, usos: 0 }]
      );
      setShowFormDialog(false);
      toast({
        title: 'Éxito',
        description: selectedItem ? 'Contenido actualizado' : 'Contenido creado',
      });
    } catch (error) {
      toast({
        title: selectedItem ? 'Error al actualizar' : 'Error al crear',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/content/${selectedItem.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }
      setItems((current) => current.filter((item) => item.id !== selectedItem.id));
      setShowDeleteDialog(false);
      setSelectedItem(null);
      toast({ title: 'Éxito', description: 'Contenido eliminado' });
    } catch (error) {
      toast({
        title: 'Error al eliminar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Cargando contenido...</div>;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Contenido</CardTitle>
          <CardDescription>Catálogo de especies y tratamientos</CardDescription>
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

  const species = items.filter((item) => item.tipo === 'especie');
  const treatments = items.filter((item) => item.tipo === 'tratamiento');

  const renderItems = (records: any[], emptyText: string) => (
    <div className="space-y-2">
      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{emptyText}</p>
      ) : (
        records.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{item.nombre}</p>
                <Badge variant={item.estado === 'ACTIVO' ? 'default' : 'secondary'}>{item.estado}</Badge>
                {item.tipo === 'especie' && <Badge variant="outline">{item.usos || 0} uso(s)</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{item.descripcion || 'Sin descripción'}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>Editar</Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setSelectedItem(item);
                  setShowDeleteDialog(true);
                }}
              >
                Eliminar
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trees className="h-5 w-5 text-green-600" />
            Gestión de Contenido
          </CardTitle>
          <CardDescription>Administra especies y tratamientos usados por el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Especies</h3>
                <Button size="sm" onClick={() => openCreateDialog('especie')}>Nueva especie</Button>
              </div>
              {renderItems(species, 'No hay especies registradas en el catálogo')}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Tratamientos</h3>
                <Button size="sm" onClick={() => openCreateDialog('tratamiento')}>Nuevo tratamiento</Button>
              </div>
              {renderItems(treatments, 'No hay tratamientos registrados en el catálogo')}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Editar contenido' : 'Crear contenido'}</DialogTitle>
            <DialogDescription>Completa la información del catálogo administrativo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(tipo) => setFormData({ ...formData, tipo })}
                disabled={Boolean(selectedItem)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especie">Especie</SelectItem>
                  <SelectItem value="tratamiento">Tratamiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder={formData.tipo === 'especie' ? 'Ej: Algarrobo' : 'Ej: Poda sanitaria'}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Detalle breve para administradores"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={(estado) => setFormData({ ...formData, estado })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {selectedItem ? 'Guardar cambios' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar contenido</DialogTitle>
            <DialogDescription>Esta acción elimina el registro del catálogo</DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ¿Eliminar <strong>{selectedItem?.nombre}</strong> del catálogo?
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Eliminando...' : 'Eliminar'}
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
