// src/components/tracker/PlayerStatsModal.tsx
'use client';

import { IPlayer } from '@/types/definitions';
import Button from '@/components/ui/Button';

interface PlayerStats {
    FGM: number;
    FGA: number;
    '3PM': number;
    '3PA': number;
    FTM: number;
    FTA: number;
    ORB: number;
    DRB: number;
    AST: number;
    STL: number;
    BLK: number;
    TOV: number;
    PF: number;
    PTS: number;
}

interface PlayerStatsModalProps {
  player: IPlayer | null;
  stats: PlayerStats;
  isOpen: boolean;
  onClose: () => void;
}

const StatItem = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
    <span className="text-gray-600 dark:text-gray-300">{label}</span>
    <span className="font-bold text-lg">{value}</span>
  </div>
);

export default function PlayerStatsModal({ player, stats, isOpen, onClose }: PlayerStatsModalProps) {
  if (!isOpen || !player) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-30" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold">{player.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">#{player.dorsal}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <StatItem label="Puntos" value={stats.PTS} />
            <StatItem label="Asistencias" value={stats.AST} />
            <StatItem label="Rebotes Ofensivos" value={stats.ORB} />
            <StatItem label="Rebotes Defensivos" value={stats.DRB} />
            <StatItem label="Robos" value={stats.STL} />
            <StatItem label="Tapones" value={stats.BLK} />
            <StatItem label="Pérdidas" value={stats.TOV} />
            <StatItem label="Faltas" value={stats.PF} />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
             <h3 className="text-lg font-semibold text-center mb-2">Tiros de Campo</h3>
             <div className="flex justify-around">
                <div><span className="font-bold">{stats.FGM} / {stats.FGA}</span> ({(stats.FGA > 0 ? (stats.FGM/stats.FGA)*100 : 0).toFixed(1)}%)</div>
             </div>
             <h3 className="text-lg font-semibold text-center mb-2 mt-2">Tiros de 3</h3>
             <div className="flex justify-around">
                <div><span className="font-bold">{stats['3PM']} / {stats['3PA']}</span> ({(stats['3PA'] > 0 ? (stats['3PM']/stats['3PA'])*100 : 0).toFixed(1)}%)</div>
             </div>
             <h3 className="text-lg font-semibold text-center mb-2 mt-2">Tiros Libres</h3>
             <div className="flex justify-around">
                <div><span className="font-bold">{stats.FTM} / {stats.FTA}</span> ({(stats.FTA > 0 ? (stats.FTM/stats.FTA)*100 : 0).toFixed(1)}%)</div>
             </div>
        </div>

        <div className="mt-6 text-center">
          <Button onClick={onClose} variant="secondary">Cerrar</Button>
        </div>
      </div>
    </div>
  );
}
