"use client";

import { useEffect, useMemo, useRef, useState, FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { utils, writeFile, read } from "xlsx";
import {
  ArrowDownTrayIcon,
  DocumentArrowUpIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { IPlayer } from "@/types/definitions";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * Este componente maneja Import/Export Excel.
 *
 * Problema DEMO:
 * - useAuth() puede devolver user=null (no hay JWT/Mongo).
 * - Antes, bloqueaba import/export por falta de user.
 *
 * Solución:
 * - Si NEXT_PUBLIC_DEMO_MODE="1" y user==null, usamos un "demoUser"
 *   desde localStorage: key "basket_demo_user" (lo crea /login en DEMO).
 * - Con eso armamos coachId/teamName para seguir usando las mismas APIs.
 *
 * REAL (Mongo):
 * - useAuth() debe traer user real.
 * - APIs:
 *   - POST /api/players/import  (Mongo)
 *   - GET  /api/players?coachId=...&teamType=...  (Mongo)
 *
 * DEMO:
 * - Las APIs deberían devolver mock si DEMO_MODE activo.
 * - Si todavía no están mockeadas, este componente igual arma datos y
 *   muestra errores amigables.
 */

interface ExcelPlayerRow {
  Nombre?: string;
  Dorsal?: string | number;
  Posición?: string;
  Equipo?: string;
  "Es Rival"?: string;
}

type DemoUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  team?: { name?: string } | null;
  demo?: boolean;
};

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}

function SectionCard({
  title,
  subtitle,
  children,
  accent = "default",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: "default" | "orange";
}) {
  return (
    <div
      className={[
        "rounded-2xl border bg-white dark:bg-gray-900 shadow-sm",
        accent === "orange"
          ? "border-orange-200 dark:border-orange-800"
          : "border-gray-200 dark:border-gray-800",
      ].join(" ")}
    >
      <div className="p-6 border-b border-gray-200/70 dark:border-gray-800/70">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              className={[
                "text-lg font-extrabold",
                accent === "orange"
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-gray-900 dark:text-gray-50",
              ].join(" ")}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {subtitle}
              </p>
            )}
          </div>

          {isDemoMode() && (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
              DEMO
            </span>
          )}
        </div>
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
}

export default function PlayerImportManager() {
  const { user } = useAuth();
  const router = useRouter();

  const DEMO_MODE = useMemo(() => isDemoMode(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // DEMO: levantar usuario desde localStorage si no hay auth real
  useEffect(() => {
    if (!DEMO_MODE) return;

    try {
      const raw = localStorage.getItem("basket_demo_user");
      setDemoUser(raw ? (JSON.parse(raw) as DemoUser) : null);
    } catch {
      setDemoUser(null);
    }
  }, [DEMO_MODE]);

  const effectiveUser: any = DEMO_MODE && !user ? demoUser : user;
  const coachId = effectiveUser?._id || "demo-coach";
  const teamName = effectiveUser?.team?.name || "Demo Team";

  const handleDownloadTemplate = () => {
    const data = [
      {
        Nombre: "Michael Jordan",
        Dorsal: 23,
        Posición: "Escolta",
        Equipo: "Chicago Bulls",
        "Es Rival": "NO",
      },
      {
        Nombre: "Larry Bird",
        Dorsal: 33,
        Posición: "Alero",
        Equipo: "Boston Celtics",
        "Es Rival": "SI",
      },
    ];

    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Plantilla Jugadores");
    writeFile(workbook, "plantilla_jugadores.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Por favor selecciona un archivo Excel.");
      return;
    }

    // DEMO: permitimos continuar aunque no haya user real
    if (!effectiveUser && !DEMO_MODE) {
      toast.error("Debes estar autenticado para importar jugadores.");
      return;
    }

    setIsSubmitting(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = read(arrayBuffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = utils.sheet_to_json<ExcelPlayerRow>(worksheet);

      if (!rawData || rawData.length === 0) {
        throw new Error("El archivo está vacío o no tiene el formato correcto.");
      }

      if (rawData.length > 30) {
        throw new Error("Solo se pueden importar hasta 30 jugadores a la vez.");
      }

      const formattedPlayers = rawData.map((row, index) => {
        if (!row.Nombre) {
          throw new Error(`Falta el nombre del jugador en la fila ${index + 2}`);
        }

        let isRival = false;
        if (row["Es Rival"] && row["Es Rival"].toString().toUpperCase() === "SI") {
          isRival = true;
        }

        return {
          name: row.Nombre,
          dorsal: row.Dorsal ? Number(row.Dorsal) : undefined,
          position: row.Posición || "",
          team: row.Equipo || (isRival ? "Equipo Rival" : teamName),
          coach: coachId,
          isRival,
        };
      });

      const response = await fetch("/api/players/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: formattedPlayers }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al importar jugadores.");
      }

      toast.success("Jugadores importados con éxito. Redirigiendo...");
      router.push("/panel/players");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error desconocido al procesar el archivo."
      );
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
    }
  };

  const handleExportAll = async () => {
    // DEMO: permitimos exportar aunque no haya user real
    if (!effectiveUser && !DEMO_MODE) {
      toast.error("Debes estar autenticado para exportar.");
      return;
    }

    setIsExporting(true);
    try {
      const userTeamParam = teamName ? `&userTeamName=${encodeURIComponent(teamName)}` : "";

      const [mineRes, rivalsRes] = await Promise.all([
        fetch(`/api/players?coachId=${coachId}&teamType=mine&limit=1000${userTeamParam}`),
        fetch(`/api/players?coachId=${coachId}&teamType=rivals&limit=1000${userTeamParam}`),
      ]);

      const [mineData, rivalsData] = await Promise.all([mineRes.json(), rivalsRes.json()]);

      if (!mineData.success || !rivalsData.success) {
        throw new Error("Error al obtener los datos de jugadores.");
      }

      const allPlayers: IPlayer[] = [...mineData.data, ...rivalsData.data];

      if (allPlayers.length === 0) {
        toast.info("No hay jugadores para exportar.");
        return;
      }

      const data = allPlayers.map((p) => ({
        Nombre: p.name,
        Dorsal: p.dorsal || "-",
        Posición: p.position || "-",
        Equipo: p.team || "-",
        "Es Rival": p.isRival ? "SI" : "NO",
        Estado: p.isActive !== false ? "Activo" : "Inactivo",
      }));

      const worksheet = utils.json_to_sheet(data);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Todos los Jugadores");
      writeFile(workbook, "todos_los_jugadores.xlsx");
      toast.success("Exportación completada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar jugadores.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Paso 1: Descargar plantilla"
        subtitle="Usá esta plantilla para importar jugadores con el formato correcto (Nombre, Dorsal, Posición, Equipo, Es Rival)."
      >
        <div className="overflow-x-auto border rounded-xl border-gray-200 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                {["Nombre", "Dorsal", "Posición", "Equipo", "Es Rival"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              <tr>
                <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Michael Jordan
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  23
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  Escolta
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  Chicago Bulls
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  NO
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Button onClick={handleDownloadTemplate} variant="secondary" className="flex items-center gap-2">
            <ArrowDownTrayIcon className="w-5 h-5" />
            Descargar Plantilla Excel
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Paso 2: Importar archivo"
        subtitle='Completá la plantilla (máx 30 jugadores) y subila acá. Nota: los jugadores importados se crean por defecto como "Desactivado".'
      >
        <form onSubmit={handleImport} className="space-y-4">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer
                       border-gray-300 bg-gray-50 hover:bg-gray-100
                       dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-800"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <DocumentArrowUpIcon className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-extrabold">Clic para subir</span> o arrastrá y soltá
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Solo .xlsx o .xls</p>
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

          {selectedFile && (
            <div className="text-sm font-semibold text-green-700 dark:text-green-400">
              Archivo seleccionado: {selectedFile.name}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={!selectedFile || isSubmitting}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            {isSubmitting ? "Importando..." : "Importar Jugadores"}
          </Button>
        </form>
      </SectionCard>

      <SectionCard
        title="Exportar lista completa"
        subtitle="Descargá un Excel con todos los jugadores (equipo + rivales) asociados a tu cuenta."
        accent="orange"
      >
        <Button
          onClick={handleExportAll}
          variant="secondary"
          disabled={isExporting}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          {isExporting ? "Exportando..." : "Exportar Lista Completa"}
        </Button>
      </SectionCard>
    </div>
  );
}
