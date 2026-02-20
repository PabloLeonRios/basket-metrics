
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const CoachDashboard = () => (
    <div className="space-y-4">
      <p className="text-lg text-gray-600 dark:text-gray-400">Selecciona una opción para empezar a gestionar tu equipo.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/panel/players" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold">Gestionar Jugadores</h2>
          <p className="text-gray-600 dark:text-gray-400">Añade o edita los perfiles de tus jugadores.</p>
        </Link>
        <Link href="/panel/sessions" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold">Gestionar Sesiones</h2>
          <p className="text-gray-600 dark:text-gray-400">Crea partidos o entrenamientos.</p>
        </Link>
        <Link href="/panel/assistant" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold">Asistente de IA</h2>
          <p className="text-gray-600 dark:text-gray-400">Obtén recomendaciones de quintetos.</p>
        </Link>
      </div>
    </div>
);

export default function DashboardPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        );
    }

    // Proteger la ruta para que solo entrenadores puedan verla
    if (user?.role !== 'entrenador') {
        return (
            <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
              <p className="text-xl text-red-500">Acceso denegado.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Panel de Entrenador</h1>
            <CoachDashboard />
        </div>
    );
}
