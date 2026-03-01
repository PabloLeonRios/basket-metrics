// src/app/panel/layout.tsx
'use client';

import { useEffect, PropsWithChildren, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Sidebar from '@/components/layout/Sidebar';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'; // For sidebar toggle icon
import { Dribbble } from 'lucide-react';

export default function PanelLayout({ children }: PropsWithChildren) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar is open by default

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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <aside className={`flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'} transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 shadow-md h-screen sticky top-0`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
          <Link href="/panel" className="flex items-center gap-2 font-bold text-xl text-orange-600">
            <Dribbble className="w-6 h-6 text-orange-500" />
            <span>Basket-Metrics</span>
          </Link>
        </div>
        <Sidebar user={user} isSidebarOpen={isSidebarOpen} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between"> {/* Changed to justify-between */}
              {/* Sidebar Toggle Button */}
              <button
                type="button"
                className="-ml-2 flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <span className="sr-only">Toggle sidebar</span>
                {isSidebarOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-gray-700 dark:text-gray-300"> {/* Increased font size */}
                      Hola, {user?.name}
                    </span>
                    {user?.role === 'entrenador' && user.team && (
                        <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 text-base font-semibold rounded-full dark:bg-orange-900 dark:text-orange-200 shadow-sm"> {/* Increased font size */}
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
  );
}
