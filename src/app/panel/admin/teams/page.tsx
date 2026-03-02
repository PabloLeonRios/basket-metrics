'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ITeam } from '@/types/definitions';

type TeamFromAPI = ITeam & { _id: string };

export default function AdminTeamManagementPage() {
  const { user: adminUser, loading: authLoading } = useAuth();
  const [teams, setTeams] = useState<TeamFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the form
  const [teamName, setTeamName] = useState('');
  const [editingTeam, setEditingTeam] = useState<TeamFromAPI | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!adminUser) return;
      try {
        setLoading(true);
        const response = await fetch('/api/teams');
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || 'Error al cargar equipos.');
        setTeams(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchTeams();
    }
  }, [adminUser, authLoading]);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    const url = editingTeam
      ? `/api/teams?teamId=${editingTeam._id}`
      : '/api/teams';
    const method = editingTeam ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || 'No se pudo guardar el equipo.');

      if (editingTeam) {
        setTeams(teams.map((t) => (t._id === editingTeam._id ? data.data : t)));
        alert('Equipo actualizado.');
      } else {
        setTeams([...teams, data.data]);
        alert('Equipo creado.');
      }
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar.');
    }
  };

  const handleEdit = (team: TeamFromAPI) => {
    setEditingTeam(team);
    setTeamName(team.name);
  };

  const handleDelete = async (teamId: string) => {
    if (
      !confirm(
        '¿Seguro que quieres eliminar este equipo? Esta acción también lo desasignará de todos los usuarios.',
      )
    )
      return;

    try {
      const response = await fetch(`/api/teams?teamId=${teamId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No se pudo eliminar.');

      setTeams(teams.filter((t) => t._id !== teamId));
      alert('Equipo eliminado.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar.');
    }
  };

  const resetForm = () => {
    setTeamName('');
    setEditingTeam(null);
  };

  if (authLoading || loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (adminUser?.role !== 'admin')
    return <div className="p-8 text-yellow-500">Acceso denegado.</div>;

  const inputStyles =
    'w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelStyles =
    'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Administración de Equipos
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Crea, edita y elimina los equipos del sistema.
        </p>
      </header>

      {/* Formulario de Creación/Edición */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">
          {editingTeam ? 'Editando Equipo' : 'Crear Nuevo Equipo'}
        </h2>
        <form
          onSubmit={handleFormSubmit}
          className="flex flex-col sm:flex-row sm:items-end gap-4"
        >
          <div className="flex-grow">
            <label htmlFor="teamName" className={labelStyles}>
              Nombre del Equipo
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className={inputStyles}
              placeholder="Ej: Lakers"
              required
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 h-[52px]"
          >
            {editingTeam ? 'Actualizar' : 'Guardar'}
          </button>
          {editingTeam && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 h-[52px]"
            >
              Cancelar
            </button>
          )}
        </form>
      </div>

      {/* Lista de Equipos */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-md">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team._id} className="border-b dark:border-gray-700">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {team.name}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(team)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(team._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
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
