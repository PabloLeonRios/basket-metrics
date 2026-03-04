'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
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
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  UsersIcon,
  FireIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * ESPEJO DEMO (sin Mongo/API):
 * - Este componente en PROD consume /api/players y /api/players/:id (PUT)
 * - En DEMO queremos ver la misma UI funcionando sin backend.
 *
 * Implementación DEMO:
 * - Se usa localStorage para persistir datos demo entre refresh:
 *   key: "basket_demo_players"
 * - Respeta: tabs (mine/rivals), filtros (inactivos, rivales), search, paginado.
 * - Acciones: editar y activar/desactivar actualizan localStorage.
 *
 * PROD/REAL:
 * - DEMO apagado => se mantiene fetch original a /api/players.
 *
 * Mejoras UI "vendibles" (sin romper data):
 * - KPIs arriba (totales calculados desde source DEMO/local o API)
 * - Barra de filtros compacta
 * - Toggle de vista: Scouting (cards) / Compacta (lista)
 *
 * REAL (ideal):
 * - Endpoint futuro para KPIs: GET /api/stats/players?coachId&teamType...
 * - Hoy lo calculamos desde la data que recibimos, para no bloquear UI.
 */

const LS_PLAYERS_KEY = 'basket_demo_players';

const DEMO_PLAYERS_SEED: IPlayer[] = [
  {
    _id: 'p1',
    name: 'Marcelo Riestra',
    dorsal: 12,
    position: 'Escolta',
    team: 'Mi Equipo',
    isActive: true,
    isRival: false,
  } as any,
  {
    _id: 'p2',
    name: 'Agustín Biglieri',
    dorsal: 7,
    position: 'Base',
    team: 'Mi Equipo',
    isActive: true,
    isRival: false,
  } as any,
  {
    _id: 'p3',
    name: 'Juan Manuel Rodríguez',
    dorsal: 15,
    position: 'Alero',
    team: 'Mi Equipo',
    isActive: true,
    isRival: false,
  } as any,
  {
    _id: 'p4',
    name: 'Tomás Fernández',
    dorsal: 4,
    position: 'Pívot',
    team: 'Mi Equipo',
    isActive: false,
    isRival: false,
  } as any,
  {
    _id: 'r1',
    name: 'Rival 1',
    dorsal: 9,
    position: 'Base',
    team: 'Águilas BC',
    isActive: true,
    isRival: true,
  } as any,
  {
    _id: 'r2',
    name: 'Rival 2',
    dorsal: 22,
    position: 'Alero',
    team: 'Toros FC',
    isActive: true,
    isRival: true,
  } as any,
];

function safeLoadPlayers(): IPlayer[] {
  try {
    const raw = localStorage.getItem(LS_PLAYERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IPlayer[]) : [];
  } catch {
    return [];
  }
}

function safeSavePlayers(players: IPlayer[]) {
  try {
    localStorage.setItem(LS_PLAYERS_KEY, JSON.stringify(players));
  } catch {
    // ignore
  }
}

function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'orange' | 'red' | 'green';
}) {
  const cls =
    tone === 'orange'
      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200 dark:border-orange-800'
      : tone === 'red'
        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800'
        : tone === 'green'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'neutral' | 'orange' | 'red' | 'green';
}) {
  const ring =
    tone === 'orange'
      ? 'ring-orange-500/15'
      : tone === 'red'
        ? 'ring-red-500/15'
        : tone === 'green'
          ? 'ring-green-500/15'
          : 'ring-gray-500/10';

  return (
    <div
      className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm ring-1 ${ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {label}
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            {value}
          </div>
          {hint && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {hint}
            </div>
          )}
        </div>
        <div className="h-10 w-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/20 flex items-center justify-center text-gray-700 dark:text-gray-200">
          {icon}
        </div>
      </div>
    </div>
  );
}

type ViewMode = 'scouting' | 'compact';

export default function PlayerManager() {
  const { user, loading: authLoading } = useAuth();

  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const DEMO_MODE = useMemo(() => process.env.NEXT_PUBLIC_DEMO_MODE === '1', []);

  // Pagination and Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [playersPerPage] = useState(9);
  const [totalPages, setTotalPages] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [showInactive, setShowInactive] = useState(false);
  const [showRivals, setShowRivals] = useState(false);
  const [activeTab, setActiveTab] = useState<'mine' | 'rivals'>('mine');

  const [viewMode, setViewMode] = useState<ViewMode>('scouting');

  // KPIs (calculados desde dataset completo DEMO o data actual REAL)
  const [kpis, setKpis] = useState({
    total: 0,
    mine: 0,
    rivals: 0,
    inactive: 0,
  });

  // Edit Modal state
  const [editingPlayer, setEditingPlayer] = useState<IPlayer | null>(null);
  const [editName, setEditName] = useState('');
  const [editDorsal, setEditDorsal] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [editIsRival, setEditIsRival] = useState(false);

  // Export methods
  const exportToExcel = () => {
    if (players.length === 0) {
      toast.info('No hay jugadores para exportar.');
      return;
    }
    const data = players.map((p) => ({
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

    const tableData = players.map((p) => [
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
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page to 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // DEMO init: seed players once
  useEffect(() => {
    if (!DEMO_MODE) return;
    const existing = safeLoadPlayers();
    if (existing.length === 0) {
      safeSavePlayers(DEMO_PLAYERS_SEED);
    }
  }, [DEMO_MODE]);

  const recomputeKpisFromAll = (all: IPlayer[]) => {
    const total = all.length;
    const mine = all.filter((p) => !p.isRival).length;
    const rivals = all.filter((p) => !!p.isRival).length;
    const inactive = all.filter((p) => p.isActive === false).length;
    setKpis({ total, mine, rivals, inactive });
  };

  useEffect(() => {
    async function fetchPlayers() {
      try {
        setError(null);
        setLoading(true);

        // ========== DEMO MODE ==========
        if (DEMO_MODE) {
          const all = safeLoadPlayers();
          recomputeKpisFromAll(all);

          // filtros
          let filtered = [...all];

          // tab mine/rivals (teamType)
          if (activeTab === 'mine') {
            filtered = filtered.filter((p) => !p.isRival);
          } else {
            filtered = filtered.filter((p) => !!p.isRival);
          }

          // showInactive
          if (showInactive) {
            filtered = filtered.filter((p) => p.isActive === false);
          }

          // showRivals (extra filter)
          if (showRivals) {
            filtered = filtered.filter((p) => !!p.isRival);
          }

          // search
          if (debouncedSearchTerm) {
            const term = debouncedSearchTerm.toLowerCase().trim();
            filtered = filtered.filter((p) => {
              const nameMatch = (p.name || '').toLowerCase().includes(term);
              const dorsalMatch = String(p.dorsal || '').includes(term);
              return nameMatch || dorsalMatch;
            });
          }

          // paginado
          const total = filtered.length;
          const pages = Math.max(1, Math.ceil(total / playersPerPage));
          setTotalPages(pages);

          const start = (currentPage - 1) * playersPerPage;
          const pageItems = filtered.slice(start, start + playersPerPage);

          setPlayers(pageItems);
          return;
        }

        // ========== REAL MODE ==========
        let url = `/api/players?page=${currentPage}&limit=${playersPerPage}`;

        if (user?.role !== 'admin') {
          url += `&coachId=${user!._id}`;
        }

        if (showInactive) url += '&status=inactive';
        if (showRivals) url += '&showRivals=true';
        if (debouncedSearchTerm) url += `&search=${debouncedSearchTerm}`;

        url += `&teamType=${activeTab}`;
        if (user?.team?.name) {
          url += `&userTeamName=${encodeURIComponent(user.team.name)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudieron cargar los jugadores.');

        const body = await response.json();

        // Compatibilidad: algunos backends devuelven {data,totalPages} o {success,data}
        const data = body?.data ?? body?.players ?? [];
        const apiTotalPages = body?.totalPages ?? 1;

        setPlayers(data);
        setTotalPages(apiTotalPages);

        /**
         * ============================
         *  NOTAS PARA PABLITO (Mongo)
         * ============================
         * Para KPIs reales:
         * - Mejor que calcularlos desde la página actual (paginada).
         * - Crear endpoint:
         *   GET /api/stats/players?coachId&teamType&userTeamName
         *   => { total, mine, rivals, inactive }
         *
         * Mientras tanto:
         * - Si el backend devuelve totales en el payload (ej: counts),
         *   se pueden mapear acá.
         */
        const counts = body?.counts || body?.meta?.counts || null;
        if (counts && typeof counts === 'object') {
          setKpis({
            total: Number(counts.total ?? 0),
            mine: Number(counts.mine ?? 0),
            rivals: Number(counts.rivals ?? 0),
            inactive: Number(counts.inactive ?? 0),
          });
        } else {
          // fallback: con lo visible
          const flat: IPlayer[] = Array.isArray(data) ? data : [];
          const inactive = flat.filter((p) => p.isActive === false).length;
          const rivals = flat.filter((p) => !!p.isRival).length;
          const mine = flat.filter((p) => !p.isRival).length;
          setKpis({
            total: flat.length,
            mine,
            rivals,
            inactive,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    // En REAL: solo si auth resuelta y hay user
    if (!DEMO_MODE) {
      if (!authLoading && user) fetchPlayers();
      return;
    }

    // En DEMO: no dependemos del user
    fetchPlayers();
  }, [
    DEMO_MODE,
    user,
    authLoading,
    currentPage,
    playersPerPage,
    debouncedSearchTerm,
    showInactive,
    showRivals,
    activeTab,
  ]);

  const handleUpdatePlayer = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    try {
      const updatedData: any = {
        name: editName,
        dorsal: editDorsal ? Number(editDorsal) : undefined,
        position: editPosition,
        team: editTeam,
        isRival: editIsRival,
      };

      // DEMO: update localStorage
      if (DEMO_MODE) {
        const all = safeLoadPlayers();
        const next = all.map((p) =>
          p._id === editingPlayer._id ? { ...p, ...updatedData } : p,
        );
        safeSavePlayers(next);

        toast.success('Jugador actualizado (DEMO).');
        setPlayers(
          players.map((p) =>
            p._id === editingPlayer._id ? { ...p, ...updatedData } : p,
          ),
        );
        setEditingPlayer(null);
        return;
      }

      // REAL: update API
      const response = await fetch(`/api/players/${editingPlayer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el jugador.');

      toast.success('Jugador actualizado.');
      setPlayers(
        players.map((p) =>
          p._id === editingPlayer._id ? { ...p, ...updatedData } : p,
        ),
      );
      setEditingPlayer(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar.');
    }
  };

  const handleToggleActive = async (player: IPlayer) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres ${player.isActive ? 'desactivar' : 'activar'} a este jugador?`,
      )
    )
      return;

    try {
      const updatedData: any = { isActive: !player.isActive };

      // DEMO
      if (DEMO_MODE) {
        const all = safeLoadPlayers();
        const next = all.map((p) =>
          p._id === player._id ? { ...p, ...updatedData } : p,
        );
        safeSavePlayers(next);

        toast.info(`Jugador ${player.isActive ? 'desactivado' : 'activado'} (DEMO).`);

        // refresh “visual” sin salir de la página
        setPlayers((prev) =>
          prev.map((p) => (p._id === player._id ? { ...p, ...updatedData } : p)),
        );
        setEditingPlayer(null);

        // recalcular KPIs
        recomputeKpisFromAll(next);
        return;
      }

      // REAL
      const response = await fetch(`/api/players/${player._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error('No se pudo cambiar el estado del jugador.');

      toast.info(`Jugador ${player.isActive ? 'desactivado' : 'activado'}.`);

      setPlayers((prev) =>
        prev.map((p) => (p._id === player._id ? { ...p, ...updatedData } : p)),
      );
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
    setEditIsRival(!!player.isRival);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const labelStyles = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="space-y-6">
      {/* Header pro */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
                Jugadores
              </h2>
              {DEMO_MODE && <Badge>DEMO</Badge>}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Gestión de roster + rivales + análisis rápido (scouting).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              onClick={exportToExcel}
              className="flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Excel
            </Button>
            <Button
              variant="secondary"
              onClick={exportToPDF}
              className="flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              PDF
            </Button>

            <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
              <button
                onClick={() => setViewMode('scouting')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition
                  ${
                    viewMode === 'scouting'
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                title="Vista Scouting"
              >
                <Squares2X2Icon className="w-4 h-4" />
                Scouting
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition
                  ${
                    viewMode === 'compact'
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                title="Vista Compacta"
              >
                <ListBulletIcon className="w-4 h-4" />
                Lista
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard
            icon={<UsersIcon className="w-5 h-5" />}
            label="Total"
            value={kpis.total}
            hint="Roster completo"
          />
          <StatCard
            icon={<FireIcon className="w-5 h-5" />}
            label="Mi equipo"
            value={kpis.mine}
            hint="No rivales"
            tone="orange"
          />
          <StatCard
            icon={<UsersIcon className="w-5 h-5" />}
            label="Rivales"
            value={kpis.rivals}
            hint="Scouting"
            tone="red"
          />
          <StatCard
            icon={<ExclamationTriangleIcon className="w-5 h-5" />}
            label="Inactivos"
            value={kpis.inactive}
            hint="A revisar"
            tone="neutral"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('mine')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm
              ${
                activeTab === 'mine'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }
            `}
          >
            Mi Equipo
          </button>
          <button
            onClick={() => setActiveTab('rivals')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm
              ${
                activeTab === 'rivals'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }
            `}
          >
            Rivales
          </button>
        </nav>
      </div>

      {/* Barra filtros pro */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            <div className="text-sm font-extrabold text-gray-900 dark:text-gray-50">
              Filtros & búsqueda
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Checkbox
              label="Ver inactivos"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            <Checkbox
              label="Mostrar rivales"
              checked={showRivals}
              onChange={(e) => setShowRivals(e.target.checked)}
            />

            <div className="w-full sm:w-[340px]">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MagnifyingGlassIcon className="w-4 h-4" />
                </span>
                <Input
                  type="text"
                  placeholder="Buscar por nombre o dorsal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  inputSize="md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-600 dark:text-gray-300">Cargando jugadores...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && players.length === 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-center text-gray-600 dark:text-gray-300">
          {debouncedSearchTerm
            ? `No se encontraron jugadores para "${debouncedSearchTerm}".`
            : 'No hay jugadores en esta lista.'}
        </div>
      )}

      {/* Vista Scouting (cards premium) */}
      {viewMode === 'scouting' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {players.map((player) => {
            const isInactive = player.isActive === false;

            return (
              <div
                key={player._id}
                className={[
                  'rounded-2xl border bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition overflow-hidden',
                  isInactive
                    ? 'border-gray-200 dark:border-gray-800 opacity-80'
                    : 'border-gray-200 dark:border-gray-800',
                ].join(' ')}
              >
                {/* top strip */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/70 dark:border-gray-800/70 bg-gray-50 dark:bg-gray-950/20">
                  <div className="flex items-center gap-2">
                    {!isInactive ? (
                      <Badge tone="green">Activo</Badge>
                    ) : (
                      <Badge tone="neutral">Inactivo</Badge>
                    )}
                    {player.isRival && <Badge tone="red">Rival</Badge>}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    {player.team || '-'}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <JerseyIcon number={player.dorsal} className="h-20 w-20 flex-shrink-0" />

                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-extrabold text-gray-900 dark:text-gray-50 truncate">
                        {player.name}
                      </div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {player.position || 'Sin posición'}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {player.dorsal != null && (
                          <Badge tone="orange">#{player.dorsal}</Badge>
                        )}
                        {player.position && <Badge>{player.position}</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Link
                      href={`/panel/players/${player._id}`}
                      className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Ver perfil
                    </Link>

                    <div className="flex items-center gap-2">
                      <Button onClick={() => openEditModal(player)} variant="secondary" size="sm">
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleToggleActive(player)}
                        variant={player.isActive ? 'danger' : 'secondary'}
                        size="sm"
                      >
                        {player.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista compacta (lista) */}
      {viewMode === 'compact' && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-950/20 border-b border-gray-200/70 dark:border-gray-800/70 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="col-span-5">Jugador</div>
            <div className="col-span-2">Dorsal</div>
            <div className="col-span-3">Equipo</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          {players.map((p) => (
            <div
              key={p._id}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-200/70 dark:border-gray-800/70 items-center"
            >
              <div className="col-span-5 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-extrabold text-gray-900 dark:text-gray-50 truncate">
                    {p.name}
                  </span>
                  {p.isRival && <Badge tone="red">Rival</Badge>}
                  {p.isActive === false && <Badge>Inactivo</Badge>}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {p.position || 'Sin posición'}
                </div>
              </div>

              <div className="col-span-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                {p.dorsal != null ? `#${p.dorsal}` : '-'}
              </div>

              <div className="col-span-3 text-sm text-gray-600 dark:text-gray-300 truncate">
                {p.team || '-'}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <Link
                  href={`/panel/players/${p._id}`}
                  className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Ver
                </Link>
                <Button onClick={() => openEditModal(p)} variant="secondary" size="sm">
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-2">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="secondary"
          >
            Anterior
          </Button>
          <span className="text-gray-700 dark:text-gray-300 text-sm font-semibold">
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

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-extrabold mb-1 text-gray-900 dark:text-gray-50">
              Editar jugador
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Actualizá datos básicos y estado.
            </p>

            <form onSubmit={handleUpdatePlayer} className="space-y-4">
              <div>
                <label htmlFor="editName" className={labelStyles}>
                  Nombre
                </label>
                <Input
                  id="editName"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="editDorsal" className={labelStyles}>
                  Dorsal
                </label>
                <Input
                  id="editDorsal"
                  type="number"
                  value={editDorsal}
                  onChange={(e) => setEditDorsal(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="editPosition" className={labelStyles}>
                  Posición
                </label>
                <Input
                  id="editPosition"
                  type="text"
                  list="edit-position-options"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                />
                <datalist id="edit-position-options">
                  <option value="Base" />
                  <option value="Escolta" />
                  <option value="Alero" />
                  <option value="Ala-Pívot" />
                  <option value="Pívot" />
                </datalist>
              </div>

              <div>
                <label htmlFor="editTeam" className={labelStyles}>
                  Equipo
                </label>
                <Input
                  id="editTeam"
                  type="text"
                  value={editTeam}
                  onChange={(e) => setEditTeam(e.target.value)}
                  placeholder={editIsRival ? 'Ej: Equipo Rival' : 'Ej: Mi Equipo'}
                />
              </div>

              <div className="py-2">
                <Checkbox
                  label="Es jugador rival"
                  checked={editIsRival}
                  onChange={(e) => setEditIsRival(e.target.checked)}
                />
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
                <Button type="submit" variant="primary">
                  Guardar
                </Button>

                <Button
                  type="button"
                  variant={editingPlayer.isActive ? 'danger' : 'secondary'}
                  onClick={() => handleToggleActive(editingPlayer)}
                >
                  {editingPlayer.isActive ? 'Desactivar' : 'Activar'}
                </Button>

                <Button type="button" onClick={() => setEditingPlayer(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
