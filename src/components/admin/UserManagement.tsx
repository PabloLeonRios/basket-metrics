// src/components/admin/UserManagement.tsx
'use client';

import { useState } from 'react';
import UserList from './UserList';
import UserCreateForm from './UserCreateForm';

type View = 'list' | 'create';

export default function UserManagement() {
  const [view, setView] = useState<View>('list');

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold">Administración de Usuarios</h1>
            <div className="flex gap-2">
                <button 
                    onClick={() => setView('list')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                    Gestión
                </button>
                <button 
                    onClick={() => setView('create')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                    Creación
                </button>
            </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {view === 'list' 
            ? 'Activa/desactiva cuentas, asigna equipos y busca usuarios.'
            : 'Crea nuevas cuentas de usuario (entrenadores, administradores, etc.).'}
        </p>
      </header>

      {view === 'list' && <UserList />}
      {view === 'create' && <UserCreateForm />}

    </div>
  );
}
