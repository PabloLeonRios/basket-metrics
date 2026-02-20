'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { IUser, ITeam } from '@/types/definitions';

// Extendemos IUser para que coincida con lo que devuelve la API, incluyendo el equipo poblado
type UserFromAPI = Omit<IUser, 'team'> & {
  _id: string;
  team?: ITeam;
  createdAt: string;
  updatedAt: string;
};

export default function AdminUserManagementPage() {
  const { user: adminUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserFromAPI[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!adminUser || adminUser.role !== 'admin') return;
      try {
        setLoading(true);
        const [usersResponse, teamsResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/teams'),
        ]);

        const usersData = await usersResponse.json();
        const teamsData = await teamsResponse.json();

        if (!usersResponse.ok)
          throw new Error(usersData.message || 'Error al cargar usuarios.');
        if (!teamsResponse.ok)
          throw new Error(teamsData.message || 'Error al cargar equipos.');

        setUsers(usersData.data);
        setTeams(teamsData.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Error desconocido al cargar datos.',
        );
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [adminUser, authLoading]);

  const handleUpdateUser = async (
    userId: string,
    payload: object,
    successMessage: string,
  ) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || 'No se pudo actualizar el usuario.');

      // Actualizar el estado localmente para reflejar el cambio en la UI
      setUsers(users.map((u) => (u._id === userId ? data.data : u)));
      alert(successMessage);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar.');
    }
  };

  const handleToggleUserStatus = (targetUser: UserFromAPI) => {
    if (adminUser?.id === targetUser._id) {
      alert('No puedes desactivar tu propia cuenta.');
      return;
    }
    const newStatus = !targetUser.isActive;
    const actionText = newStatus ? 'activar' : 'desactivar';
    if (
      !confirm(
        `¿Seguro que quieres ${actionText} al usuario ${targetUser.name}?`,
      )
    )
      return;

    handleUpdateUser(
      targetUser._id,
      { isActive: newStatus },
      `Usuario ${actionText}do.`,
    );
  };

  const handleTeamChange = (
    e: ChangeEvent<HTMLSelectElement>,
    userId: string,
  ) => {
    const teamId = e.target.value;
    handleUpdateUser(userId, { teamId }, 'Equipo del usuario actualizado.');
  };

  if (authLoading || loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (adminUser?.role !== 'admin')
    return <div className="p-8 text-yellow-500">Acceso denegado.</div>;

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Administración de Usuarios
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Activa/desactiva cuentas y asigna usuarios a equipos.
        </p>
      </header>
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-md">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Equipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={user.team?._id || ''}
                    onChange={(e) => handleTeamChange(e, user._id)}
                    className="w-full p-2 border-gray-300 rounded-md dark:bg-gray-700"
                    disabled={user.role === 'admin'}
                  >
                    <option value="">Sin equipo</option>
                    {teams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleToggleUserStatus(user)}
                    disabled={adminUser?.id === user._id}
                    className={`font-bold py-2 px-4 rounded ${adminUser?.id === user._id ? 'bg-gray-400 cursor-not-allowed' : user.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {user.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
