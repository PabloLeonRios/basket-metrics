'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ISession } from '@/types/definitions';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

export default function SessionManager() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculationStatus, setCalculationStatus] = useState<{
    [sessionId: string]: 'idle' | 'calculating' | 'done' | 'error';
  }>({});
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(9);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    async function fetchSessions() {
      if (!user) return;
      try {
        setLoading(true);
        const isAdmin = user.role === 'admin';
        const statusParam = activeTab === 'open' ? 'open' : 'closed';
        
        let sessionsUrl = `/api/sessions?page=${currentPage}&limit=${sessionsPerPage}&status=${statusParam}`;

        if (!isAdmin) {
          sessionsUrl += `&coachId=${user._id}`;
        }
        
        const sessionsRes = await fetch(sessionsUrl);

        if (!sessionsRes.ok) {
          throw new Error('No se pudieron cargar las sesiones.');
        }

        const { data: sessionsData, totalCount, totalPages: apiTotalPages } = await sessionsRes.json();

        setSessions(sessionsData);
        setTotalSessions(totalCount);
        setTotalPages(apiTotalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      fetchSessions();
    }
  }, [user, authLoading, currentPage, sessionsPerPage, activeTab]);

  const handleCalculateStats = async (sessionId: string) => {
    setCalculationStatus((prev) => ({ ...prev, [sessionId]: 'calculating' }));
    try {
      const response = await fetch(`/api/engine/calculate/${sessionId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Falló el cálculo de estadísticas.');
      setCalculationStatus((prev) => ({ ...prev, [sessionId]: 'done' }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al calcular.');
      setCalculationStatus((prev) => ({ ...prev, [sessionId]: 'error' }));
    }
  };

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-8">
      {/* Lista de Sesiones */}
      <div className="space-y-4">
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
            <button 
                onClick={() => { setActiveTab('open'); setCurrentPage(1); }}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'open' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Abiertas ({activeTab === 'open' ? totalSessions : '...'})
            </button>
            <button 
                onClick={() => { setActiveTab('closed'); setCurrentPage(1); }}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'closed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Cerradas ({activeTab === 'closed' ? totalSessions : '...'})
            </button>
        </div>

        {sessions.length === 0 && totalSessions === 0 && <p>No hay sesiones en esta categoría.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md flex flex-col h-full transition-transform transform hover:scale-105 hover:shadow-lg"
            >
              <div className="flex-grow">
                <p className="font-bold text-lg">{session.name}</p>
                <div className="text-sm text-gray-500">
                  <p>{session.sessionType}</p>
                  <p>Inicio: {new Date(session.date).toLocaleString()}</p>
                  {session.finishedAt && (
                    <p className="text-green-600">Fin: {new Date(session.finishedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 w-full">
                {activeTab === 'open' ? (
                  <>
                    <Link
                      href={`/panel/tracker/${session._id}`}
                      className="text-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 w-full"
                    >
                      Ir al Tracker
                    </Link>
                    <Link
                      href={`/panel/sessions/${session._id}/edit`}
                      className="text-center bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 w-full"
                    >
                      Editar
                    </Link>
                  </>
                ) : null}

                {(session.sessionType === 'Partido' || session.sessionType === 'Lanzamiento') && (
                  <>
                    <Button
                      onClick={() => handleCalculateStats(session._id)}
                      disabled={calculationStatus[session._id] === 'calculating' || calculationStatus[session._id] === 'done'}
                      variant="secondary"
                      size="md"
                      className="w-full"
                    >
                      {calculationStatus[session._id] === 'calculating'
                        ? 'Calculando...'
                        : 'Calcular/Recalcular Stats'}
                    </Button>
                    {(calculationStatus[session._id] === 'done' || session.finishedAt) && (
                      <Link
                        href={`/panel/dashboard/${session._id}`}
                        className="text-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 w-full"
                      >
                        Resumen
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
              size="sm"
            >
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                variant={currentPage === page ? 'primary' : 'secondary'}
                size="sm"
                className={currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}
              >
                {page}
              </Button>
            ))}
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="sm"
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
