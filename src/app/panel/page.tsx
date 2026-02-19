// src/app/panel/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlayerProfile from '@/components/players/PlayerProfile';

interface User {
  id: string;
  name: string;
  role: string;
}

// Un componente simple para el dashboard del entrenador
const CoachDashboard = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Panel de Entrenador</h1>
    <p>Selecciona una opción para empezar a gestionar tu equipo.</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Link
        href="/panel/players"
        className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
      >
        <h2 className="text-xl font-bold">Gestionar Jugadores</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Añade o edita los perfiles de tus jugadores.
        </p>
      </Link>
      <Link
        href="/panel/sessions"
        className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
      >
        <h2 className="text-xl font-bold">Gestionar Sesiones</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Crea partidos o entrenamientos.
        </p>
      </Link>
      <Link
        href="/panel/assistant"
        className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
      >
        <h2 className="text-xl font-bold">Asistente de IA</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Obtén recomendaciones de quintetos.
        </p>
      </Link>
    </div>
  </div>
);

export default function PanelPage() {
  const [user, setUser] = useState<User | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Obtener el usuario actual
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) throw new Error('No autenticado');
        const { data: userData } = await userRes.json();
        setUser(userData);

        // 2. Si es un jugador, obtener su perfil de jugador
        if (userData.role === 'jugador') {
          const playerProfileRes = await fetch('/api/me/player-profile');
          if (!playerProfileRes.ok)
            throw new Error('Perfil de jugador no encontrado.');
          const { data: playerProfileData } = await playerProfileRes.json();
          setPlayerId(playerProfileData._id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return (
      <div>
        Error al cargar el perfil. Por favor, intenta iniciar sesión de nuevo.
      </div>
    );
  }

  // Renderizar el dashboard correspondiente
  if (user.role === 'entrenador') {
    return <CoachDashboard />;
  }

  if (user.role === 'jugador' && playerId) {
    return <PlayerProfile playerId={playerId} />;
  }

  return <div>Rol de usuario no reconocido.</div>;
}
