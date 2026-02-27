import CreateSessionForm from '@/components/sessions/CreateSessionForm';

export default function CreateSessionPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-6">
        Crear Nueva Sesión
      </h1>
      <CreateSessionForm />
    </div>
  );
}
