// src/app/admin/users/page.tsx
import UserManager from '@/components/admin/UserManager';

export default function AdminUsersPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Administración de Usuarios
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Activa o gestiona los usuarios registrados en la plataforma.
        </p>
      </header>

      <UserManager />
    </div>
  );
}
