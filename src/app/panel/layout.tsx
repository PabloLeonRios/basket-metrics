// src/app/panel/layout.tsx
'use client';

import { useEffect, PropsWithChildren, Fragment } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import Button from '@/components/ui/Button';

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
      window.location.href = '/login';
    }
  };

  const navLinks = [
    { name: 'Dashboard', href: '/panel/dashboard' },
    {
      name: 'Jugadores',
      basePath: '/panel/players',
      items: [
        { name: 'Alta/Modificación', href: '/panel/players' },
        // Future link: { name: 'Estadísticas Globales', href: '/panel/players/stats' },
      ],
    },
    {
      name: 'Sesiones',
      basePath: '/panel/sessions',
      items: [
        { name: 'Alta/Modificación', href: '/panel/sessions' },
        // Future link: { name: 'Visualizar Calendario', href: '/panel/sessions/calendar' },
      ],
    },
    { name: 'Asistente', href: '/panel/assistant', basePath: '/panel/assistant' },
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
                {navLinks.map((link) =>
                  link.items ? (
                    <Menu as="div" className="relative inline-block text-left" key={link.name}>
                      <div>
                        <Menu.Button className={`inline-flex w-full justify-center rounded-md px-2 py-2 text-sm font-semibold transition-colors ${pathname.startsWith(link.basePath) ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'}`}>
                          {link.name}
                          <ChevronDownIcon className="-mr-1 ml-1 h-5 w-5" aria-hidden="true" />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="px-1 py-1">
                            {link.items.map((item) => (
                              <Menu.Item key={item.name}>
                                {({ active }) => (
                                  <Link
                                    href={item.href}
                                    className={`${
                                      active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-gray-100'
                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                  >
                                    {item.name}
                                  </Link>
                                )}
                              </Menu.Item>
                            ))}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <Link
                      key={link.name}
                      href={link.href!}
                      className={`font-semibold px-2 py-2 ${pathname.startsWith(link.basePath || link.href!) ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'}`}
                    >
                      {link.name}
                    </Link>
                  )
                )}
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
            <Button
              onClick={handleLogout}
              variant="danger"
              size="sm"
            >
              Cerrar Sesión
            </Button>
          </div>
        </nav>
      </header>
      <main className="container mx-auto p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
