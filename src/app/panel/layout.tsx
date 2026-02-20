// src/app/panel/layout.tsx
'use client';

import { useEffect, PropsWithChildren } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function PanelLayout({ children }: PropsWithChildren) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
      // Forzar recarga para asegurar que el estado de useAuth se limpie
      window.location.href = '/login';
    }
  };

  const navLinks = [
    { name: 'Dashboard', href: '/panel/dashboard' },
    { name: 'Jugadores', href: '/panel/players' },
    { name: 'Sesiones', href: '/panel/sessions' },
    { name: 'Asistente', href: '/panel/assistant' },
  ];

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-950 shadow-md sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/panel" className="font-bold text-xl text-blue-600">
              Basket-Metrics
            </Link>
            
            {user?.role === 'entrenador' && (
              <div className="hidden md:flex items-center gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`font-semibold ${pathname.startsWith(link.href) ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'}`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
            {user?.role === 'admin' && (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/panel/admin/users" className={`font-semibold ${pathname.startsWith('/panel/admin/users') ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'}`}>
                  Usuarios
                </Link>
                <Link href="/panel/admin/teams" className={`font-semibold ${pathname.startsWith('/panel/admin/teams') ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'}`}>
                  Equipos
                </Link>
              </div>
            )}
          </div>
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
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </nav>
      </header>
      <main className="container mx-auto p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
