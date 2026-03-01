// src/app/panel/sessions/[sessionId]/edit/page.tsx
import EditSessionForm from '@/components/sessions/EditSessionForm';

export default async function EditSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = await params;

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Editar Sesión
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Modifica los jugadores de la sesión o elimínala si no tiene
            movimientos.
          </p>
        </header>

        <EditSessionForm sessionId={sessionId} />
      </div>
    </main>
  );
}
