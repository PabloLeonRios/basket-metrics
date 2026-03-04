// src/app/panel/dashboard/[sessionId]/page.tsx
import Dashboard from '@/components/dashboard/Dashboard';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Dashboard de Sesión
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Resumen de las estadísticas avanzadas calculadas.
        </p>
      </header>

      <Dashboard sessionId={sessionId} />
    </div>
  );
}
