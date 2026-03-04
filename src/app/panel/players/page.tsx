// src/app/panel/players/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PlayerManager from "@/components/players/PlayerManager";
import { isDemoMode } from "@/lib/demo";
import {
  Search,
  Users,
  TrendingUp,
  Target,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * Objetivo: que /panel/players sea "vendible" y clara para el coach.
 *
 * Hoy PlayerManager resuelve CRUD, pero la página era muy básica.
 * Este archivo suma:
 * - Hero con contexto y CTAs
 * - KPIs rápidos (en DEMO con fallback)
 * - Buscador UI (sin romper PlayerManager)
 * - Layout premium consistente con el Dashboard
 *
 * REAL / Mongo:
 * - Ideal: GET /api/players?teamId=... => lista completa
 * - Ideal: GET /api/stats/players?teamId=... => KPIs (activos, promedio GS, TS%).
 *
 * DEMO:
 * - Si DEMO_MODE está activo y falla la API, mostramos KPIs demo.
 * - El buscador por ahora es UI; si PlayerManager soporta filtro por props,
 *   se conecta fácil (ver nota más abajo).
 *
 * Mejora futura (simple):
 * - Modificar PlayerManager para aceptar prop `searchQuery` y filtrar internamente.
 *   PlayerManager({ searchQuery }) => filtra en memoria (DEMO) o consulta API (REAL).
 */

type KPI = {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-white/70 text-gray-700 dark:bg-gray-900/60 dark:text-gray-200 border border-gray-200/60 dark:border-gray-800">
      {children}
    </span>
  );
}

function Surface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-gray-200/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/70 backdrop-blur shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function KpiCard({ kpi }: { kpi: KPI }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-950/20 backdrop-blur shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            {kpi.label}
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            {kpi.value}
          </div>
        </div>

        {kpi.icon && (
          <div className="h-10 w-10 rounded-2xl border border-gray-200/70 dark:border-gray-800/80 bg-white/70 dark:bg-gray-950/30 flex items-center justify-center text-gray-700 dark:text-gray-200">
            {kpi.icon}
          </div>
        )}
      </div>

      {kpi.hint && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {kpi.hint}
        </div>
      )}
    </div>
  );
}

export default function PlayersPage() {
  const DEMO = useMemo(() => isDemoMode(), []);

  const [search, setSearch] = useState("");
  const [dataSource, setDataSource] = useState<"API" | "DEMO_FALLBACK">("API");
  const [kpis, setKpis] = useState<KPI[]>([
    {
      label: "Jugadores activos",
      value: "—",
      hint: "En tu equipo",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Game Score promedio",
      value: "—",
      hint: "Rendimiento global",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      label: "TS% promedio",
      value: "—",
      hint: "Eficiencia de tiro",
      icon: <Target className="h-5 w-5" />,
    },
  ]);

  useEffect(() => {
    const run = async () => {
      // Fallback DEMO para que siempre se vea bien
      const demoKpis: KPI[] = [
        {
          label: "Jugadores activos",
          value: "12",
          hint: "En tu equipo",
          icon: <Users className="h-5 w-5" />,
        },
        {
          label: "Game Score promedio",
          value: "9.6",
          hint: "Rendimiento global",
          icon: <TrendingUp className="h-5 w-5" />,
        },
        {
          label: "TS% promedio",
          value: "54%",
          hint: "Eficiencia de tiro",
          icon: <Target className="h-5 w-5" />,
        },
      ];

      try {
        /**
         * ============================
         *  NOTAS PARA PABLITO (Mongo)
         * ============================
         * REAL:
         * - Crear endpoint: GET /api/stats/players?teamId=...
         *   => { activePlayers, avgGameScore, avgTS }
         *
         * DEMO:
         * - Si no existe o falla, usamos demoKpis.
         */
        const res = await fetch("/api/stats", { cache: "no-store" }).catch(() => null);

        if (res && res.ok) {
          const js = await res.json().catch(() => ({}));
          const fromStats =
            js?.playersKpis || js?.data?.playersKpis || js?.data?.kpisPlayers || null;

          // Si el backend no tiene este shape aún, mantenemos fallback.
          if (fromStats && typeof fromStats === "object") {
            const active = fromStats.activePlayers ?? fromStats.active ?? null;
            const avgGS = fromStats.avgGameScore ?? fromStats.gameScoreAvg ?? null;
            const avgTS = fromStats.avgTS ?? fromStats.tsAvg ?? null;

            setKpis([
              {
                label: "Jugadores activos",
                value: active != null ? String(active) : "—",
                hint: "En tu equipo",
                icon: <Users className="h-5 w-5" />,
              },
              {
                label: "Game Score promedio",
                value: avgGS != null ? String(avgGS) : "—",
                hint: "Rendimiento global",
                icon: <TrendingUp className="h-5 w-5" />,
              },
              {
                label: "TS% promedio",
                value: avgTS != null ? String(avgTS) : "—",
                hint: "Eficiencia de tiro",
                icon: <Target className="h-5 w-5" />,
              },
            ]);

            setDataSource("API");
            return;
          }
        }

        // Si DEMO o API incompleta => fallback
        setKpis(demoKpis);
        setDataSource("DEMO_FALLBACK");
      } catch {
        setKpis(demoKpis);
        setDataSource("DEMO_FALLBACK");
      }
    };

    run();
  }, [DEMO]);

  return (
    <div className="relative">
      {/* Fondo premium */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-orange-500/12 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(249,115,22,0.08),transparent_42%),radial-gradient(circle_at_70%_60%,rgba(249,115,22,0.06),transparent_45%)]" />
      </div>

      <main className="relative mx-auto max-w-6xl space-y-6">
        {/* HERO */}
        <Surface className="overflow-hidden">
          <div className="p-6 md:p-7">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    Players
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{DEMO ? "DEMO" : "REAL"}</Badge>
                    <Badge>{dataSource === "API" ? "Datos API" : "Datos Demo"}</Badge>
                  </div>
                </div>

                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
                  Gestionar Jugadores
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                  Alta, edición y análisis rápido. Tenés una vista clara para tomar decisiones
                  sin perder contexto.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {/* CTA: no sabemos si PlayerManager tiene "nuevo", lo dejamos como scroll + visual */}
                  <a
                    href="#players-manager"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo jugador
                  </a>

                  <Link
                    href="/panel/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition dark:bg-gray-800"
                  >
                    Volver al Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/panel/assistant"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                  >
                    <Sparkles className="h-4 w-4" />
                    Asistente IA
                  </Link>
                </div>
              </div>

              {/* Buscador + tip */}
              <div className="w-full lg:max-w-[520px]">
                <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800/80 bg-white/70 dark:bg-gray-950/20 backdrop-blur p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-gray-900 dark:text-gray-50">
                      Buscar jugador
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Nombre / #camiseta
                    </span>
                  </div>

                  <div className="mt-3 relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Ej: Agustín o #7"
                      className="w-full rounded-2xl border border-gray-200/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/60 px-10 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>

                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                    Tip: acá estamos dejando el buscador listo. En el próximo paso,
                    conectamos este valor para filtrar dentro de <b>PlayerManager</b>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Surface>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {kpis.map((k, i) => (
            <KpiCard key={i} kpi={k} />
          ))}
        </div>

        {/* MANAGER */}
        <Surface>
          <div className="p-6 border-b border-gray-200/70 dark:border-gray-800/80">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-50">
              Lista y edición
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Administrá tu roster. (En el próximo paso conectamos el buscador para filtrar.)
            </p>
          </div>

          <div id="players-manager" className="p-6">
            {/* Mantengo el componente actual para no romper lógica */}
            <PlayerManager />
          </div>
        </Surface>

        {/* Nota */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {dataSource === "DEMO_FALLBACK"
            ? "Mostrando KPIs DEMO (fallback) porque las APIs no devolvieron datos específicos de jugadores."
            : "Mostrando KPIs desde APIs (si falta un campo, se completa con placeholders)."}
        </div>
      </main>
    </div>
  );
}
