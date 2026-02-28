// src/components/admin/UserList.tsx
'use client';

import { useState, useEffect } from 'react';
import { IUser, ITeam } from '@/types/definitions';
import { useAuth } from '@/hooks/useAuth';
import Dropdown from '@/components/ui/Dropdown';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { toast } from 'react-toastify';

export default function UserList() {
    const { user: adminUser, loading: authLoading } = useAuth();
    const [users, setUsers] = useState<IUser[]>([]);
    const [teams, setTeams] = useState<ITeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const fetchData = async () => {
        if (!adminUser || adminUser.role !== 'admin') return;
        try {
            setLoading(true);
            const [teamsRes, usersRes] = await Promise.all([
                fetch('/api/teams'),
                fetch(`/api/users?teamId=${selectedTeam}&search=${debouncedSearchTerm}`)
            ]);

            if (!teamsRes.ok) throw new Error('Error al cargar equipos.');
            if (!usersRes.ok) throw new Error('Error al cargar usuarios.');

            const teamsData = await teamsRes.json();
            const usersData = await usersRes.json();

            setTeams(teamsData.data || []);
            setUsers(usersData.data || []);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido.');
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
            if (!response.ok) throw new Error(data.message || 'No se pudo actualizar.');

            setUsers(prev => prev.map(u => (u._id === userId ? { ...u, ...data.data } : u)));
            toast.success(successMessage);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al actualizar.');
        }
    };
    
    if (authLoading || loading) return <div className="p-8 text-center">Cargando...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    const teamOptions = [{ value: '', label: 'Todos los equipos' }, ...teams.map(t => ({ value: t._id, label: t.name }))];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input type="text" placeholder="Buscar por nombre o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Dropdown options={teamOptions} value={selectedTeam} onChange={setSelectedTeam} />
            </div>
            <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-md">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Dropdown
                                options={[{ value: '', label: 'Sin equipo' }, ...teams.map(t => ({ value: t._id, label: t.name }))]}
                                value={user.team?._id || ''}
                                onChange={(teamId) => handleUpdateUser(user._id, { teamId: teamId || null }, 'Equipo actualizado.')}
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
                            <td colSpan={5} className="text-center py-8 text-gray-500">No se encontraron usuarios.</td>
                        </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
