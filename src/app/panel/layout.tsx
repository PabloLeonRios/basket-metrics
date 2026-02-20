// src/app/panel/layout.tsx
'use client';

import { useState, useEffect, PropsWithChildren } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface UserPayload {
  id: string;
  name: string;
  role: string;
}

export default function PanelLayout({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Fallo al obtener los datos del usuario.');
        }
        const { data } = await response.json();
        setUser(data);
      } catch (error) {
        console.error(error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Fallo al cerrar sesión en el servidor', error);
    } finally {
      router.push('/login');
    }
  };

  const navLinks = [
    { name: 'Jugadores', href: '/panel/players' },
    { name: 'Sesiones', href: '/panel/sessions' },
    { name: 'Asistente', href: '/panel/assistant' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-950 shadow-md">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="font-bold text-xl text-blue-600">
              <Link href="/panel">Basket-Metrics</Link>
            </div>
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
                    <Link
                        href="/panel/admin/users"
                        className={`font-semibold ${pathname.startsWith('/panel/admin/users') ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'}`}
                    >
                        Usuarios
                    </Link>
                    <Link
                        href="/panel/admin/teams"
                        className={`font-semibold ${pathname.startsWith('/panel/admin/teams') ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'}`}
                    >
                        Equipos
                    </Link>
                </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300">
              Hola, {user?.name}
            </span>
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
