// app/admin/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si no está autenticado
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Si está autenticado pero no es admin
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [status, session?.user?.role, router]);

  // Mostrar spinner mientras carga
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si no es admin, no renderizar (el useEffect lo redirigirá)
  if (session?.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <div className="border-b bg-white dark:bg-slate-950 shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Panel Administrativo</h1>
                  <p className="text-muted-foreground">
                    Gestión del Sistema EcoDataAI
                  </p>
                </div>
              </div>
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Ir al Inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <AdminDashboard />
        </div>

        {/* Footer */}
        <div className="border-t bg-white dark:bg-slate-950 mt-12">
          <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
            <p>
              Panel Administrativo - Sistema de Gestión de Roles y Permisos
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
