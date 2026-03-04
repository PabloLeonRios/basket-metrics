// src/app/panel/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isDemoMode } from "@/lib/demo";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * DASHBOARD "vendible" (UI fuerte) sin romper el backend futuro.
 *
 * MODO DEMO (sin Mongo):
 * - Este dashboard intenta consumir APIs existentes:
 *   - GET /api/stats (si existe)
 *   - GET /api/players (si existe)
 * - Si alguna falla (404/500), cae a datos mock para que SIEMPRE se vea bien.
 *
 * MODO REAL (Mongo):
 * - Reemplazar los fetch "best-effort" por endpoints formales:
 *   - GET /api/dashboard/coach?teamId&from&to
 *     => { kpis, topPlayers, recentSessions }
 * - Los KPIs deberían venir agregados desde Mongo:
 *   - players.count({teamId})
 *   - sessions.count({teamId, date range})
 *   - stats.aggregate(...) para TS%, eFG%, GameScore promedio, etc.
 *
 * Importante:
 * - Este archivo NO cambia modelos ni lógica de backend.
 * - Solo consume /api/* si está disponible.
 */

type KPI = {
  label: string;
  value: string;
  hint?: string;
};

type TopPlayer = {
  id: string;
  name: string;
  number?: number | null;
  gameScore?: number | null;
  points?: number | null;
  ts?: number | null; // 0..1
};

type RecentSession = {
  id: string;
  title: string;
  dateLabel: string;
  status?: "Abierta" | "Cerrada" | "Borrador";
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function formatPct(v?: number | null) {
  if (v == null || Number.isNaN(v)) return "—";
  return `${Math.round(v * 100)}%`;
}

function formatNum(v?: number | null, digits = 1) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(digits);
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
      {children}
    </span>
  );
}

function Card({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
        {title}
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
        {value}
      </div>
      {hint && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ value01 }: { value01: number }) {
  const pct = clamp(Math.round(value01 * 100), 0, 100);
  return (
    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div
        className="h-2 rounded-full bg-orange-600"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const DEMO = useMemo(() => isDemoMode(), []);

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [dataSource, setDataSource] = useState<"API" | "DEMO_FALLBACK">("API");

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      // Defaults "vendibles" (si falla API, queda igual)
      const demoKpis: KPI[] = [
        { label: "Jugadores activos", value: "12", hint: "En tu equipo actual" },
        { label: "Sesiones (últimos 7 días)", value: "4", hint: "Entrenamientos + partidos" },
        { label: "Game Score promedio", value: "9.6", hint: "Rendimiento global" },
        { label: "TS% promedio", value: "54%", hint: "Eficiencia de tiro" },
      ];

      const demoTop: TopPlayer[] = [
        { id: "p1", name: "Marcelo Riestra", number: 12, gameScore: 10.1, points: 11.8, ts: 0.56 },
        { id: "p2", name: "Agustín Biglieri", number: 7, gameScore: 10.0, points: 11.9, ts: 0.55 },
        { id: "p3", name: "Juan Manuel Rodríguez", number: 15, gameScore: 7.5, points: 7.3, ts: 0.49 },
      ];

      const demoSessions: RecentSession[] = [
        { id: "s1", title: "Entrenamiento - Táctica", dateLabel: "Hace 2 días", status: "Cerrada" },
        { id: "s2", title: "Partido vs. Rival", dateLabel: "Hace 4 días", status: "Cerrada" },
        { id: "s3", title: "Lanzamientos + FT", dateLabel: "Hace 6 días", status: "Cerrada" },
      ];

      try {
        // 1) Intentar /api/stats (si existe)
        // La forma puede variar, así que lo tratamos como "best-effort".
        let apiUsed = false;

        const statsRes = await fetch("/api/stats", { cache: "no-store" }).catch(() => null);

        if (statsRes && statsRes.ok) {
          const js = await statsRes.json().catch(() => ({}));
          // intentamos detectar estructuras comunes
          const maybeKpis =
            js?.kpis ||
            js?.data?.kpis ||
            null;

          const maybeTop =
            js?.topPlayers ||
            js?.data?.topPlayers ||
            js?.data?.top ||
            null;

          const maybeSessions =
            js?.recentSessions ||
            js?.data?.recentSessions ||
            js?.data?.sessions ||
            null;

          if (Array.isArray(maybeKpis) || Array.isArray(maybeTop) || Array.isArray(maybeSessions)) {
            apiUsed = true;

            setKpis(
              Array.isArray(maybeKpis)
                ? maybeKpis.map((x: any) => ({
                    label: String(x?.label ?? x?.title ?? "KPI"),
                    value: String(x?.value ?? "—"),
                    hint: x?.hint ? String(x.hint) : undefined,
                  }))
                : demoKpis
            );

            setTopPlayers(
              Array.isArray(maybeTop)
                ? maybeTop.slice(0, 6).map((p: any) => ({
                    id: String(p?._id ?? p?.id ?? p?.playerId ?? crypto.randomUUID()),
                    name: String(p?.name ?? p?.fullName ?? "Jugador"),
                    number: p?.number ?? p?.jerseyNumber ?? null,
                    gameScore: p?.gameScore ?? p?.gs ?? null,
                    points: p?.points ?? p?.pts ?? null,
                    ts: p?.ts ?? p?.trueShooting ?? null,
                  }))
                : demoTop
            );

            setRecentSessions(
              Array.isArray(maybeSessions)
                ? maybeSessions.slice(0, 5).map((s: any) => ({
                    id: String(s?._id ?? s?.id ?? s?.sessionId ?? crypto.randomUUID()),
                    title: String(s?.title ?? s?.name ?? "Sesión"),
                    dateLabel: String(s?.dateLabel ?? s?.date ?? "Reciente"),
                    status: (s?.status as any) ?? undefined,
                  }))
                : demoSessions
            );
          }
        }

        // 2) Si /api/stats no dio datos, intentamos /api/players para armar "Top" básico
        if (!apiUsed) {
          const playersRes = await fetch("/api/players", { cache: "no-store" }).catch(() => null);

          if (playersRes && playersRes.ok) {
            const js = await playersRes.json().catch(() => ({}));
            const list = js?.data || js?.players || js || [];
            if (Array.isArray(list) && list.length) {
              apiUsed = true;

              // armamos top básico (si no hay stats, solo mostramos nombres)
              const top = list.slice(0, 6).map((p: any, idx: number) => ({
                id: String(p?._id ?? p?.id ?? `p-${idx}`),
                name: String(p?.name ?? p?.fullName ?? "Jugador"),
                number: p?.number ?? p?.jerseyNumber ?? null,
                gameScore: p?.gameScore ?? null,
                points: p?.points ?? null,
                ts: p?.ts ?? null,
              }));

              setTopPlayers(top);

              // KPIs mínimos con players count
              setKpis([
                { label: "Jugadores activos", value: String(list.length), hint: "En tu equipo actual" },
                { label: "Sesiones (últimos 7 días)", value: "—", hint: "Pendiente de stats reales" },
                { label: "Game Score promedio", value: "—", hint: "Pendiente de stats reales" },
                { label: "TS% promedio", value: "—", hint: "Pendiente de stats reales" },
              ]);

              setRecentSessions(demoSessions);
            }
          }
        }

        if (!apiUsed) {
          setDataSource("DEMO_FALLBACK");
          setKpis(demoKpis);
          setTopPlayers(demoTop);
          setRecentSessions(demoSessions);
        } else {
          setDataSource("API");
        }
      } catch {
        setDataSource("DEMO_FALLBACK");
        setKpis(demoKpis);
        setTopPlayers(demoTop);
        setRecentSessions(demoSessions);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [DEMO]);

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.12),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(249,115,22,0.10),transparent_40%)]" />
        </div>

        <div className="relative p-6 md:p-8 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Dashboard
              </div>
              <h1 className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
                Panel de Entrenador
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">
                Una vista clara de rendimiento, eficiencia y foco de trabajo. Diseñado para tomar decisiones rápidas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge>{DEMO ? "DEMO" : "REAL"}</Badge>
              <Badge>{dataSource === "API" ? "Datos API" : "Datos Demo"}</Badge>
            </div>
          </div>

          {/* ACCIONES TOP */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/panel/players"
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition"
            >
              Ver jugadores
            </Link>
            <Link
              href="/panel/sessions"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition dark:bg-gray-800"
            >
              Gestionar sesiones
            </Link>
            <Link
              href="/panel/assistant"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
            >
              Asistente IA
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {(loading ? Array.from({ length: 4 }) : kpis).map((k: any, i: number) => (
          <div key={i}>
            {loading ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
                <div className="h-4 w-36 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="mt-3 h-9 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="mt-3 h-3 w-44 bg-gray-100 dark:bg-gray-800/60 rounded" />
              </div>
            ) : (
              <Card title={k.label} value={k.value} hint={k.hint} />
            )}
          </div>
        ))}
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* TOP PLAYERS */}
        <div className="xl:col-span-2 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-50">
                Top Jugadores
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Rendimiento y eficiencia (Game Score, Puntos y TS% si está disponible).
              </p>
            </div>
            <Link
              href="/panel/players"
              className="text-sm font-semibold text-orange-700 dark:text-orange-300 hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          <div className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="py-2">Jugador</th>
                  <th className="py-2">Game Score</th>
                  <th className="py-2">Puntos</th>
                  <th className="py-2">TS%</th>
                </tr>
              </thead>
              <tbody>
                {(topPlayers.length ? topPlayers : []).slice(0, 6).map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-gray-200 dark:border-gray-800"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-orange-600/15 border border-orange-500/20 flex items-center justify-center font-extrabold text-orange-700 dark:text-orange-200">
                          {(p.name?.[0] ?? "J").toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-gray-50">
                            {p.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {p.number != null ? `Camiseta #${p.number}` : "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 font-semibold text-gray-900 dark:text-gray-50">
                      {formatNum(p.gameScore, 1)}
                    </td>

                    <td className="py-3 font-semibold text-gray-900 dark:text-gray-50">
                      {formatNum(p.points, 1)}
                    </td>

                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-24">
                          <ProgressBar value01={p.ts ?? 0} />
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-gray-50">
                          {formatPct(p.ts)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {!topPlayers.length && !loading && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-500 dark:text-gray-400">
                      No hay jugadores para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT SESSIONS */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-50">
              Sesiones recientes
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Últimos entrenamientos y partidos.
            </p>
          </div>

          <div className="p-6 space-y-3">
            {(recentSessions.length ? recentSessions : []).slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/30 p-4 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-gray-50">
                      {s.title}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {s.dateLabel}
                    </div>
                  </div>
                  {s.status && (
                    <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                      {s.status}
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div className="pt-2">
              <Link
                href="/panel/sessions"
                className="inline-flex w-full items-center justify-center rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition"
              >
                Ir a Sesiones
              </Link>
            </div>

            {!recentSessions.length && !loading && (
              <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                No hay sesiones recientes.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {dataSource === "DEMO_FALLBACK"
          ? "Mostrando datos DEMO (fallback) porque las APIs no devolvieron datos."
          : "Mostrando datos desde APIs (si faltan campos, se completa con placeholders)."}
      </div>
    </div>
  );
}
