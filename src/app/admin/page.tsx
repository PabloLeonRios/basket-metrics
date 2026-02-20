// src/app/admin/page.tsx
'use client';

import React from 'react';
import UserManager from '@/components/admin/UserManager';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Panel de Administrador</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Gestiona los usuarios y activa nuevas cuentas.</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Gestión de Usuarios</h2>
        <UserManager />
      </section>
    </div>
  );
}
