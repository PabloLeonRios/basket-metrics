'use client';

import { useState, useRef, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { toast } from 'react-toastify';
import { utils, writeFile, read } from 'xlsx';
import { ArrowDownTrayIcon, DocumentArrowUpIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { IPlayer } from '@/types/definitions';

interface ExcelPlayerRow {
  Nombre?: string;
  Dorsal?: string | number;
  Posición?: string;
  Equipo?: string;
  'Es Rival'?: string;
}

export default function PlayerImportManager() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const data = [
      {
        Nombre: 'Michael Jordan',
        Dorsal: 23,
        Posición: 'Escolta',
        Equipo: 'Chicago Bulls',
        'Es Rival': 'NO',
      },
      {
        Nombre: 'Larry Bird',
        Dorsal: 33,
        Posición: 'Alero',
        Equipo: 'Boston Celtics',
        'Es Rival': 'SI',
      },
    ];

    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Plantilla Jugadores');
    writeFile(workbook, 'plantilla_jugadores.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo Excel.');
      return;
    }

    if (!user) {
      toast.error('Debes estar autenticado para importar jugadores.');
      return;
    }

    setIsSubmitting(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = read(arrayBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = utils.sheet_to_json<ExcelPlayerRow>(worksheet);

      if (!rawData || rawData.length === 0) {
        throw new Error('El archivo está vacío o no tiene el formato correcto.');
      }

      if (rawData.length > 30) {
        throw new Error('Solo se pueden importar hasta 30 jugadores a la vez.');
      }

      const formattedPlayers = rawData.map((row, index) => {
        if (!row.Nombre) {
          throw new Error(`Falta el nombre del jugador en la fila ${index + 2}`);
        }

        let isRival = false;
        if (row['Es Rival'] && row['Es Rival'].toString().toUpperCase() === 'SI') {
          isRival = true;
        }

        return {
          name: row.Nombre,
          dorsal: row.Dorsal ? Number(row.Dorsal) : undefined,
          position: row.Posición || '',
          team: row.Equipo || (isRival ? 'Equipo Rival' : user.team?.name),
          coach: user._id,
          isRival,
        };
      });

      const response = await fetch('/api/players/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: formattedPlayers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al importar jugadores.');
      }

      toast.success('Jugadores importados con éxito. Redirigiendo...');
      router.push('/panel/players');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido al procesar el archivo.');
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
    }
  };

  const handleExportAll = async () => {
    if (!user) {
      toast.error('Debes estar autenticado para exportar.');
      return;
    }

    setIsExporting(true);
    try {
      // Fetch both mine and rivals without limits
      const [mineRes, rivalsRes] = await Promise.all([
        fetch(`/api/players?coachId=${user._id}&teamType=mine&limit=1000${user.team?.name ? `&userTeamName=${encodeURIComponent(user.team.name)}` : ''}`),
        fetch(`/api/players?coachId=${user._id}&teamType=rivals&limit=1000${user.team?.name ? `&userTeamName=${encodeURIComponent(user.team.name)}` : ''}`)
      ]);

      const [mineData, rivalsData] = await Promise.all([mineRes.json(), rivalsRes.json()]);

      if (!mineData.success || !rivalsData.success) {
        throw new Error('Error al obtener los datos de jugadores.');
      }

      const allPlayers: IPlayer[] = [...mineData.data, ...rivalsData.data];

      if (allPlayers.length === 0) {
        toast.info('No hay jugadores para exportar.');
        setIsExporting(false);
        return;
      }

      const data = allPlayers.map((p) => ({
        Nombre: p.name,
        Dorsal: p.dorsal || '-',
        Posición: p.position || '-',
        Equipo: p.team || '-',
        'Es Rival': p.isRival ? 'SI' : 'NO',
        Estado: p.isActive !== false ? 'Activo' : 'Inactivo',
      }));

      const worksheet = utils.json_to_sheet(data);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Todos los Jugadores');
      writeFile(workbook, 'todos_los_jugadores.xlsx');
      toast.success('Exportación completada.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al exportar jugadores.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">Paso 1: Descargar Plantilla Base</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Para importar jugadores correctamente, debes utilizar el archivo de plantilla base.
          Este archivo contiene las cabeceras exactas (Nombre, Dorsal, Posición, Equipo, Es Rival)
          y un ejemplo visual de cómo llenarlo.
        </p>
        <div className="overflow-x-auto mb-4 border rounded-lg border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dorsal</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Es Rival</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">Michael Jordan</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">23</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Escolta</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Chicago Bulls</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">NO</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Button onClick={handleDownloadTemplate} variant="secondary" className="flex items-center gap-2">
          <ArrowDownTrayIcon className="w-5 h-5" />
          Descargar Plantilla Excel
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">Paso 2: Subir Archivo</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Una vez hayas completado la plantilla (máximo 30 jugadores), súbela aquí.
          <strong> Nota:</strong> Los jugadores importados se crearán por defecto en estado "Desactivado".
        </p>
        <form onSubmit={handleImport} className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <DocumentArrowUpIcon className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Solo archivos .xlsx o .xls</p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </label>
          </div>
          {selectedFile && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Archivo seleccionado: {selectedFile.name}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={!selectedFile || isSubmitting}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            {isSubmitting ? 'Importando...' : 'Importar Jugadores'}
          </Button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-orange-200 dark:border-orange-800">
        <h2 className="text-xl font-bold mb-4 text-orange-700 dark:text-orange-500">Exportar Todos los Jugadores</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Descarga un archivo Excel con <strong>todos los jugadores</strong> asignados a tu cuenta, incluyendo tanto los de tu equipo como los rivales.
        </p>
        <Button
          onClick={handleExportAll}
          variant="secondary"
          disabled={isExporting}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          {isExporting ? 'Exportando...' : 'Exportar Lista Completa'}
        </Button>
      </div>
    </div>
  );
}
