'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { IPlayer } from '@/types/definitions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import JerseyIcon from '@/components/ui/JerseyIcon';
import { toast } from 'react-toastify';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function PlayerManager() {
  const { user, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [playersPerPage] = useState(9);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [activeTab, setActiveTab] = useState<'mine' | 'rivals'>('mine');

  // Edit Modal state
  const [editingPlayer, setEditingPlayer] = useState<IPlayer | null>(null);
  const [editName, setEditName] = useState('');
  const [editDorsal, setEditDorsal] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editTeam, setEditTeam] = useState('');

  // Export methods
  const exportToExcel = () => {
    if (players.length === 0) {
      toast.info('No hay jugadores para exportar.');
      return;
    }
    const data = players.map(p => ({
      Nombre: p.name,
      Dorsal: p.dorsal || '-',
      Posición: p.position || '-',
      Equipo: p.team || '-',
      Estado: p.isActive !== false ? 'Activo' : 'Inactivo',
    }));

    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Jugadores');
    writeFile(workbook, 'jugadores.xlsx');
  };

  const exportToPDF = () => {
    if (players.length === 0) {
      toast.info('No hay jugadores para exportar.');
      return;
    }

    const doc = new jsPDF();
    doc.text('Listado de Jugadores', 14, 15);

    const tableData = players.map(p => [
      p.name,
      p.dorsal?.toString() || '-',
      p.position || '-',
      p.team || '-',
      p.isActive !== false ? 'Activo' : 'Inactivo',
    ]);

    autoTable(doc, {
      startY: 20,
      head: [['Nombre', 'Dorsal', 'Posición', 'Equipo', 'Estado']],
      body: tableData,
    });

    doc.save('jugadores.pdf');
  };

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  
  // Reset page to 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    async function fetchPlayers() {
      // The guard `if (!authLoading && user)` is now outside.
      try {
        setLoading(true);
        let url = `/api/players?page=${currentPage}&limit=${playersPerPage}`;

        // If the user is not an admin, they must be a coach. Fetch their players.
        if (user?.role !== 'admin') {
          url += `&coachId=${user!._id}`;
        }
        // Admins can see all players, so we don't add coachId for them.

        if (showInactive) {
            url += '&status=inactive';
        }
        if (debouncedSearchTerm) {
          url += `&search=${debouncedSearchTerm}`;
        }
        url += `&teamType=${activeTab}`;
        if (user?.team?.name) {
          url += `&userTeamName=${encodeURIComponent(user.team.name)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudieron cargar los jugadores.');
        
        const { data, totalCount, totalPages: apiTotalPages } = await response.json();
        setPlayers(data);
        setTotalPlayers(totalCount);
        setTotalPages(apiTotalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    // Only fetch if authentication is resolved and we have a user.
    if (!authLoading && user) {
      fetchPlayers();
    }
  }, [user, authLoading, currentPage, playersPerPage, debouncedSearchTerm, showInactive, activeTab]);

  const handleUpdatePlayer = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    try {
      const updatedData = { name: editName, dorsal: Number(editDorsal), position: editPosition, team: editTeam };
      const response = await fetch(`/api/players/${editingPlayer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el jugador.');

      toast.success('Jugador actualizado.');
      setPlayers(players.map(p => p._id === editingPlayer._id ? { ...p, ...updatedData } : p));
      setEditingPlayer(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar.');
    }
  };

  const handleToggleActive = async (player: IPlayer) => {
    if (!confirm(`¿Estás seguro de que quieres ${player.isActive ? 'desactivar' : 'activar'} a este jugador?`)) return;
    try {
      const updatedData = { isActive: !player.isActive };
      const response = await fetch(`/api/players/${player._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error('No se pudo cambiar el estado del jugador.');
      
      toast.info(`Jugador ${player.isActive ? 'desactivado' : 'activado'}.`);
      setPlayers(players.filter(p => p._id !== player._id)); // Remove from current list
      setEditingPlayer(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado.');
    }
  };
  
  const openEditModal = (player: IPlayer) => {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditDorsal(String(player.dorsal || ''));
    setEditPosition(player.position || '');
    setEditTeam(player.team || '');
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const labelStyles = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="space-y-8">
      {/* Pestañas (Tabs) */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('mine')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'mine'
                ? 'border-orange-500 text-orange-600 dark:text-orange-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            Mi Equipo
          </button>
          <button
            onClick={() => setActiveTab('rivals')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'rivals'
                ? 'border-orange-500 text-orange-600 dark:text-orange-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            Rivales
          </button>
        </nav>
      </div>

      {/* Lista de Jugadores */}
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl font-bold">Gestión de Jugadores</h2>
            <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={exportToExcel} className="flex items-center gap-2">
                <ArrowDownTrayIcon className="w-4 h-4" />
                Excel
              </Button>
              <Button variant="secondary" onClick={exportToPDF} className="flex items-center gap-2">
                <ArrowDownTrayIcon className="w-4 h-4" />
                PDF
              </Button>
              <Checkbox label="Ver Inactivos" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              <div className="w-full max-w-xs">
                  <Input type="text" placeholder="Buscar por nombre o dorsal..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} inputSize="md" />
              </div>
            </div>
        </div>
        
        {loading && <p>Cargando jugadores...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && players.length === 0 && (
            <p className="text-center py-4">{debouncedSearchTerm ? `No se encontraron jugadores para "${debouncedSearchTerm}".` : 'No hay jugadores en esta lista.'}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <div key={player._id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md flex flex-col h-full transition-transform transform hover:scale-105 hover:shadow-lg">
              <div className="flex-grow flex items-center space-x-4">
                <JerseyIcon number={player.dorsal} className="h-24 w-24 flex-shrink-0" />
                <div className="flex-grow">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-50">{player.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{player.position || 'Sin posición'}</p>
                  {player.team && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Equipo: {player.team}</p>}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Link href={`/panel/players/${player._id}`} className="text-sm text-blue-500 hover:underline">Ver Perfil</Link>
                <Button onClick={() => openEditModal(player)} variant="secondary" size="sm">Editar</Button>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
            >
              Anterior
            </Button>
            <span className="text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="secondary"
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4">Editar Jugador</h3>
            <form onSubmit={handleUpdatePlayer} className="space-y-4">
              <div>
                <label htmlFor="editName" className={labelStyles}>Nombre</label>
                <Input id="editName" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="editDorsal" className={labelStyles}>Dorsal</label>
                <Input id="editDorsal" type="number" value={editDorsal} onChange={(e) => setEditDorsal(e.target.value)} />
              </div>
              <div>
                <label htmlFor="editPosition" className={labelStyles}>Posición</label>
                <Input id="editPosition" type="text" list="edit-position-options" value={editPosition} onChange={(e) => setEditPosition(e.target.value)} />
                <datalist id="edit-position-options">
                  <option value="Base" />
                  <option value="Escolta" />
                  <option value="Alero" />
                  <option value="Ala-Pívot" />
                  <option value="Pívot" />
                </datalist>
              </div>
              <div>
                <label htmlFor="editTeam" className={labelStyles}>Equipo</label>
                <Input id="editTeam" type="text" value={editTeam} onChange={(e) => setEditTeam(e.target.value)} placeholder="Ej: Equipo Rival" />
              </div>
              <div className="flex justify-between items-center pt-4">
                <Button type="submit" variant="primary">Guardar Cambios</Button>
                <Button type="button" variant={editingPlayer.isActive ? 'danger' : 'secondary'} onClick={() => handleToggleActive(editingPlayer)}>
                  {editingPlayer.isActive ? 'Desactivar' : 'Activar'}
                </Button>
                <Button type="button" onClick={() => setEditingPlayer(null)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
