// src/app/panel/layout.tsx
'use client';

import { useEffect, PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Sidebar from '@/components/layout/Sidebar';

export default function PanelLayout({ children }: PropsWithChildren) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Fallo al cerrar sesión en el servidor', error);
    } finally {
      window.location.href = '/login';
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-900 shadow-md">
          <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
            <Link href="/panel" className="font-bold text-xl text-blue-600">
              Basket-Metrics
            </Link>
          </div>
          <Sidebar />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-end">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                      <span className="text-gray-700 dark:text-gray-300">
                        Hola, {user?.name}
                      </span>
                      {user?.role === 'entrenador' && user.team && (
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full dark:bg-blue-900 dark:text-blue-200">
                              {user.team.name}
                          </span>
                      )}
                  </div>
                  <Button onClick={handleLogout} variant="danger" size="sm">
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </header>
          {/* Page Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
