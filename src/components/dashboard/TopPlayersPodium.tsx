// src/components/dashboard/TopPlayersPodium.tsx
"use client";

import Link from "next/link";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * Este componente es 100% UI.
 * - No toca Mongo ni APIs.
 * - Recibe `players` ya resueltos por el dashboard.
 *
 * En REAL:
 * - El dashboard debería traer topPlayers ya rankeados desde backend (Mongo aggregate)
 * - Este componente solo renderiza.
 */

export type TopPlayer = {
  id: string;
  name: string;
  number?: number | null;
  gameScore?: number | null;
  points?: number | null;
  ts?: number | null; // 0..1
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

function Medal({ idx }: { idx: number }) {
  // 0: oro, 1: plata, 2: bronce
  const styles =
    idx === 0
      ? "bg-orange-600 text-white"
      : idx === 1
      ? "bg-gray-900 text-white dark:bg-gray-700"
      : "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100 border border-orange-200/60 dark:border-orange-800/60";

  const label = idx === 0 ? "1" : idx === 1 ? "2" : "3";

  return (
    <div className={`h-9 w-9 rounded-2xl flex items-center justify-center font-extrabold ${styles}`}>
      {label}
    </div>
  );
}

function PlayerAvatar({ name }: { name: string }) {
  return (
    <div className="h-12 w-12 rounded-2xl bg-orange-600/15 border border-orange-500/20 flex items-center justify-center font-extrabold text-orange-700 dark:text-orange-200">
      {(name?.[0] ?? "J").toUpperCase()}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/30 px-3 py-2">
      <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-extrabold text-gray-900 dark:text-gray-50">
        {value}
      </div>
    </div>
  );
}

function TsBar({ ts }: { ts?: number | null }) {
  const v = ts == null || Number.isNaN(ts) ? null : clamp(ts, 0, 1);
  const pct = v == null ? 0 : Math.round(v * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
        <span>TS%</span>
        <span className="text-gray-900 dark:text-gray-50">{formatPct(v)}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-2 rounded-full bg-orange-600"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function TopPlayersPodium({
  players,
  hrefAll = "/panel/players",
  title = "Top 3 Jugadores",
  subtitle = "Ranking por rendimiento (Game Score) + eficiencia (TS%).",
}: {
  players: TopPlayer[];
  hrefAll?: string;
  title?: string;
  subtitle?: string;
}) {
  const top3 = (players || []).slice(0, 3);

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-50">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {subtitle}
          </p>
        </div>

        <Link
          href={hrefAll}
          className="text-sm font-semibold text-orange-700 dark:text-orange-300 hover:underline whitespace-nowrap"
        >
          Ver todos →
        </Link>
      </div>

      <div className="p-6">
        {top3.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((p, idx) => (
              <div
                key={p.id}
                className={[
                  "rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/30 p-5",
                  "hover:shadow-sm transition",
                  idx === 0 ? "md:-translate-y-2" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Medal idx={idx} />
                    <PlayerAvatar name={p.name} />
                  </div>

                  {p.number != null && (
                    <div className="text-xs font-semibold rounded-full px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                      #{p.number}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="text-base font-extrabold text-gray-900 dark:text-gray-50 leading-tight">
                    {p.name}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {idx === 0 ? "MVP del equipo" : idx === 1 ? "Muy sólido" : "En alza"}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <StatPill label="Game Score" value={formatNum(p.gameScore, 1)} />
                  <StatPill label="Puntos" value={formatNum(p.points, 1)} />
                </div>

                <div className="mt-4">
                  <TsBar ts={p.ts} />
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="w-full rounded-2xl bg-gray-900 text-white font-semibold py-2.5 hover:opacity-90 transition dark:bg-gray-800"
                    onClick={() => {
                      // CTA simple para ahora: ir al listado
                      window.location.href = hrefAll;
                    }}
                  >
                    Ver perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            No hay jugadores para mostrar.
          </div>
        )}
      </div>
    </div>
  );
}
