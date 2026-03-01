'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import TopPlayers from '@/components/dashboard/TopPlayers';
import UpcomingMatches from '@/components/dashboard/UpcomingMatches';

export default function DashboardPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        );
    }

    if (user?.role !== 'entrenador') {
        return (
            <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
              <p className="text-xl text-red-500">Acceso denegado. Esta sección es solo para entrenadores.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Panel de Entrenador</h1>
                <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">Bienvenido de nuevo, {user.name}.</p>
            </div>
            
            <TopPlayers />

            <div className="space-y-4">
              <h2 className="text-xl font-bold">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/panel/players" className="block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-orange-500 border border-transparent transition-all duration-300 group">
                  <h3 className="text-xl font-bold group-hover:text-orange-500 transition-colors">Gestionar Jugadores</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Añade o edita los perfiles de tus jugadores.</p>
                </Link>
                <Link href="/panel/sessions" className="block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-orange-500 border border-transparent transition-all duration-300 group">
                  <h3 className="text-xl font-bold group-hover:text-orange-500 transition-colors">Gestionar Sesiones</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Crea partidos o entrenamientos.</p>
                </Link>
                <Link href="/panel/assistant" className="block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-orange-500 border border-transparent transition-all duration-300 group">
                  <h3 className="text-xl font-bold group-hover:text-orange-500 transition-colors">Asistente de IA</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Obtén recomendaciones de quintetos.</p>
                </Link>
              </div>
            </div>

            <UpcomingMatches />
        </div>
    );
}
