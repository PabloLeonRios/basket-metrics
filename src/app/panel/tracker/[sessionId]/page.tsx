// src/app/panel/tracker/[sessionId]/page.tsx
import GameTracker from '@/components/tracker/GameTracker';

// Esta página es un Server Component. Su única función es obtener el sessionId
// de la URL y pasárselo al componente cliente que manejará toda la interactividad.
export default function TrackerPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Game Tracker</h1>
      <GameTracker sessionId={sessionId} />
    </div>
  );
}
