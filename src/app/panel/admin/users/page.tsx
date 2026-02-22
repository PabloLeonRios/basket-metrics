'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { IUser, ITeam } from '@/types/definitions';
import Dropdown from '@/components/ui/Dropdown';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { toast } from 'react-toastify';

// Extendemos IUser para que coincida con lo que devuelve la API
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

  // Filter and Search states
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      if (!adminUser || adminUser.role !== 'admin') return;
      try {
        setLoading(true);
        const teamsResponse = await fetch('/api/teams');
        const teamsData = await teamsResponse.json();
        if (!teamsResponse.ok) throw new Error(teamsData.message || 'Error al cargar equipos.');
        setTeams(teamsData.data);
        
        let usersUrl = '/api/users?';
        if (selectedTeam) usersUrl += `teamId=${selectedTeam}&`;
        if (debouncedSearchTerm) usersUrl += `search=${debouncedSearchTerm}&`;
        
        const usersResponse = await fetch(usersUrl);
        const usersData = await usersResponse.json();
        if (!usersResponse.ok) throw new Error(usersData.message || 'Error al cargar usuarios.');

        setUsers(usersData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [adminUser, authLoading, selectedTeam, debouncedSearchTerm]);

  const handleUpdateUser = async (userId: string, payload: object, successMessage: string) => {
    if (payload.hasOwnProperty('isActive') && adminUser?._id === userId) {
        toast.error('No puedes desactivar tu propia cuenta.');
        return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No se pudo actualizar el usuario.');

      setUsers((prevUsers) =>
        prevUsers.map((u) => (u._id === userId ? { ...u, ...data.data } : u)),
      );

      toast.success(successMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar.');
    }
  };

  if (authLoading || loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (adminUser?.role !== 'admin') return <div className="p-8 text-yellow-500">Acceso denegado.</div>;

  const teamOptions = [{ value: '', label: 'Todos los equipos' }, ...teams.map(t => ({ value: t._id, label: t.name }))];

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Administración de Usuarios</h1>
        <p className="mt-1 text-sm text-gray-500">Activa/desactiva cuentas, asigna equipos y busca usuarios.</p>
      </header>
      
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="w-full sm:w-1/3">
            <Dropdown 
                options={teamOptions}
                value={selectedTeam}
                onChange={setSelectedTeam}
                label="Filtrar por Equipo"
            />
        </div>
        <div className="w-full sm:w-1/3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
            <Input 
                type="text"
                placeholder="Nombre, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>
      
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-md">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {users.length > 0 ? users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Dropdown
                    options={[{ value: '', label: 'Sin equipo' }, ...teams.map(t => ({ value: t._id, label: t.name }))]}
                    value={user.team?._id || ''}
                    onChange={(teamId) => handleUpdateUser(user._id, { teamId }, 'Equipo del usuario actualizado.')}
                    className="w-full"
                    disabled={user.role === 'admin'}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button
                    onClick={() => handleUpdateUser(user._id, { isActive: !user.isActive }, `Usuario ${user.isActive ? 'desactivado' : 'activado'}.`)}
                    disabled={adminUser?._id === user._id}
                    variant={user.isActive ? 'danger' : 'primary'}
                    size="sm"
                  >
                    {user.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No se encontraron usuarios con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
