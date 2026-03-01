// src/components/admin/UserCreateForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { ITeam } from '@/types/definitions';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import { toast } from 'react-toastify';

export default function UserCreateForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'entrenador' | 'admin'>('entrenador');
  const [teamId, setTeamId] = useState<string>('');
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTeams() {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data.data);
      }
    }
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Nombre, email y contraseña son requeridos.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, teamId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el usuario.');
      }
      toast.success('¡Usuario creado exitosamente!');
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setRole('entrenador');
      setTeamId('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setLoading(false);
    }
  };

  const teamOptions = [
    { value: '', label: 'Asignar equipo (opcional)' },
    ...teams.map((t) => ({ value: t._id, label: t.name })),
  ];
  const roleOptions = [
    { value: 'entrenador', label: 'Entrenador' },
    { value: 'admin', label: 'Administrador' },
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Nombre Completo
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Contraseña
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rol de Usuario
          </label>
          <Dropdown
            options={roleOptions}
            value={role}
            onChange={(value) => setRole(value as any)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Equipo
          </label>
          <Dropdown options={teamOptions} value={teamId} onChange={setTeamId} />
        </div>
        <div className="pt-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </div>
      </form>
    </div>
  );
}
