// src/components/tracker/SubstitutionModal.tsx
'use client';

import { IPlayer } from '@/types/definitions';
import Button from '@/components/ui/Button';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerToSubOut: IPlayer | null;
  benchPlayers: IPlayer[];
  onSubstitute: (playerIn: IPlayer) => void;
}

export default function SubstitutionModal({
  isOpen,
  onClose,
  playerToSubOut,
  benchPlayers,
  onSubstitute,
}: SubstitutionModalProps) {
  if (!isOpen || !playerToSubOut) return null;

  const eligiblePlayers = benchPlayers.filter(p => p.team === playerToSubOut.team);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">Sustituir a {playerToSubOut.name}</h3>
        <p className="text-sm mb-4">Selecciona el jugador que entrará a la cancha.</p>
        <div className="space-y-1 max-h-60 overflow-y-auto border-t border-b border-gray-200 dark:border-gray-700 py-2">
          {eligiblePlayers.length > 0 ? (
            eligiblePlayers.map(player => (
              <button 
                key={player._id} 
                onClick={() => onSubstitute(player)} 
                className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                #{player.dorsal} - {player.name}
              </button>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No hay jugadores en el banquillo de este equipo.</p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
