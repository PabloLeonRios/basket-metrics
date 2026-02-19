// src/app/panel/assistant/page.tsx
import Assistant from '@/components/assistant/Assistant';

export default function AssistantPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Asistente de Entrenador
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Obtén recomendaciones de quintetos basadas en datos y situaciones de
          partido.
        </p>
      </header>

      <Assistant />
    </div>
  );
}
