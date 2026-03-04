// src/app/panel/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isDemoMode } from "@/lib/demo";
import TopPlayersPodium, { TopPlayer } from "@/components/dashboard/TopPlayersPodium";
import {
  Users,
  CalendarDays,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Trophy,
} from "lucide-react";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * DASHBOARD "vendible" (UI fuerte) sin romper el backend futuro.
 *
 * MODO DEMO (sin Mongo):
 * - Intenta consumir APIs existentes:
 *   - GET /api/stats (si existe)
 *   - GET /api/players (si existe)
 * - Si falla, cae a datos mock para que SIEMPRE se vea bien.
 *
 * MODO REAL (Mongo):
 * - Endpoint recomendado:
 *   GET /api/dashboard/coach?teamId&from&to
 *   => { kpis, topPlayers, recentSessions, upcomingGames }
 *
 * - upcomingGames podría venir de:
 *   - games.find({ teamId, date >= today }).sort(date).limit(3)
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

type RecentSession = {
  id: string;
  title: string;
  dateLabel: string;
  status?: "Abierta" | "Cerrada" | "Borrador";
};

type UpcomingGame = {
  id: string;
  vs: string;
  when: string; // "15 Nov 2024"
  time?: string;
  venue?: string;
  local?: boolean;
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

function Card({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/70 backdrop-blur shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            {title}
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            {value}
          </div>
        </div>

        {icon && (
          <div className="h-10 w-10 rounded-2xl border border-gray-200/70 dark:border-gray-800/80 bg-white/70 dark:bg-gray-950/30 flex items-center justify-center text-gray-700 dark:text-gray-200">
            {icon}
          </div>
        )}
      </div>

      {hint && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </div>
      )}
    </div>
  );
}

function QuickAction({
  title,
  desc,
  href,
  icon,
}: {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "group block rounded-3xl border border-gray-200/70 dark:border-gray-800/80",
        "bg-white/80 dark:bg-gray-900/70 backdrop-blur shadow-sm p-5",
        "hover:shadow-md transition",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-orange-600/12 border border-orange-500/20 flex items-center justify-center text-orange-700 dark:text-orange-200">
            {icon}
          </div>
          <div>
            <div className="text-base font-extrabold text-gray-900 dark:text-gray-50">
              {title}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {desc}
            </div>
          </div>
        </div>

        <div className="mt-1 text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition">
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

function GameCard({ g }: { g: UpcomingGame }) {
  return (
    <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-950/30 backdrop-blur p-5 hover:shadow-sm transition">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold rounded-full px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200/70 dark:border-gray-700">
          {g.local ? "Local" : "Visitante"}
        </div>
        <Trophy className="h-4 w-4 text-orange-600 dark:text-orange-300" />
      </div>

      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">vs</div>
      <div className="mt-1 text-lg font-extrabold text-gray-900 dark:text-gray-50">
        {g.vs}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
          <span className="font-semibold">Fecha</span>
          <span className="font-bold text-gray-900 dark:text-gray-50">{g.when}</span>
        </div>
        {g.time && (
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
            <span className="font-semibold">Hora</span>
            <span className="font-bold text-gray-900 dark:text-gray-50">{g.time}</span>
          </div>
        )}
        {g.venue && (
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
            <span className="font-semibold">Cancha</span>
            <span className="font-bold text-gray-900 dark:text-gray-50">{g.venue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const DEMO = useMemo(() => isDemoMode(), []);

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingGame[]>([]);
  const [dataSource, setDataSource] = useState<"API" | "DEMO_FALLBACK">("API");

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      // DEMO Defaults (vendibles)
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

      const demoUpcoming: UpcomingGame[] = [
        { id: "g1", local: true, vs: "Águilas BC", when: "15 Nov 2024", time: "20:00", venue: "Pabellón Principal" },
        { id: "g2", local: false, vs: "Toros FC", when: "22 Nov 2024", time: "18:30", venue: "Cancha Visitante" },
        { id: "g3", local: true, vs: "Leones", when: "29 Nov 2024", time: "19:00", venue: "Pabellón Principal" },
      ];

      try {
        let apiUsed = false;

        // 1) Intentar /api/stats (best-effort)
        const statsRes = await fetch("/api/stats", { cache: "no-store" }).catch(() => null);

        if (statsRes && statsRes.ok) {
          const js = await statsRes.json().catch(() => ({}));

          const maybeKpis = js?.kpis || js?.data?.kpis || null;
          const maybeTop = js?.topPlayers || js?.data?.topPlayers || js?.data?.top || null;
          const maybeSessions = js?.recentSessions || js?.data?.recentSessions || js?.data?.sessions || null;
          const maybeUpcoming = js?.upcomingGames || js?.data?.upcomingGames || js?.data?.upcoming || null;

          if (
            Array.isArray(maybeKpis) ||
            Array.isArray(maybeTop) ||
            Array.isArray(maybeSessions) ||
            Array.isArray(maybeUpcoming)
          ) {
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
                ? maybeTop.slice(0, 6).map((p: any, idx: number) => ({
                    id: String(p?._id ?? p?.id ?? p?.playerId ?? `p-${idx}`),
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
                ? maybeSessions.slice(0, 5).map((s: any, idx: number) => ({
                    id: String(s?._id ?? s?.id ?? s?.sessionId ?? `s-${idx}`),
                    title: String(s?.title ?? s?.name ?? "Sesión"),
                    dateLabel: String(s?.dateLabel ?? s?.date ?? "Reciente"),
                    status: (s?.status as any) ?? undefined,
                  }))
                : demoSessions
            );

            setUpcoming(
              Array.isArray(maybeUpcoming)
                ? maybeUpcoming.slice(0, 3).map((g: any, idx: number) => ({
                    id: String(g?._id ?? g?.id ?? `g-${idx}`),
                    vs: String(g?.vs ?? g?.opponent ?? "Rival"),
                    when: String(g?.when ?? g?.dateLabel ?? g?.date ?? "Próximo"),
                    time: g?.time ? String(g.time) : undefined,
                    venue: g?.venue ? String(g.venue) : undefined,
                    local: !!(g?.local ?? g?.isLocal),
                  }))
                : demoUpcoming
            );
          }
        }

        // 2) Fallback: /api/players para tener top básico
        if (!apiUsed) {
          const playersRes = await fetch("/api/players", { cache: "no-store" }).catch(() => null);

          if (playersRes && playersRes.ok) {
            const js = await playersRes.json().catch(() => ({}));
            const list = js?.data || js?.players || js || [];

            if (Array.isArray(list) && list.length) {
              apiUsed = true;

              const top = list.slice(0, 6).map((p: any, idx: number) => ({
                id: String(p?._id ?? p?.id ?? `p-${idx}`),
                name: String(p?.name ?? p?.fullName ?? "Jugador"),
                number: p?.number ?? p?.jerseyNumber ?? null,
                gameScore: p?.gameScore ?? null,
                points: p?.points ?? null,
                ts: p?.ts ?? null,
              }));

              setTopPlayers(top);

              setKpis([
                { label: "Jugadores activos", value: String(list.length), hint: "En tu equipo actual" },
                { label: "Sesiones (últimos 7 días)", value: "—", hint: "Pendiente de stats reales" },
                { label: "Game Score promedio", value: "—", hint: "Pendiente de stats reales" },
                { label: "TS% promedio", value: "—", hint: "Pendiente de stats reales" },
              ]);

              setRecentSessions(demoSessions);
              setUpcoming(demoUpcoming);
            }
          }
        }

        if (!apiUsed) {
          setDataSource("DEMO_FALLBACK");
          setKpis(demoKpis);
          setTopPlayers(demoTop);
          setRecentSessions(demoSessions);
          setUpcoming(demoUpcoming);
        } else {
          setDataSource("API");
        }
      } catch {
        setDataSource("DEMO_FALLBACK");
        setKpis(demoKpis);
        setTopPlayers(demoTop);
        setRecentSessions(demoSessions);
        setUpcoming([
          { id: "g1", local: true, vs: "Águilas BC", when: "15 Nov 2024", time: "20:00", venue: "Pabellón Principal" },
          { id: "g2", local: false, vs: "Toros FC", when: "22 Nov 2024", time: "18:30", venue: "Cancha Visitante" },
          { id: "g3", local: true, vs: "Leones", when: "29 Nov 2024", time: "19:00", venue: "Pabellón Principal" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [DEMO]);

  return (
    <div className="relative">
      {/* Fondo "vendible" (profundo pero limpio) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-orange-500/12 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(249,115,22,0.08),transparent_42%),radial-gradient(circle_at_70%_60%,rgba(249,115,22,0.06),transparent_45%)]" />
      </div>

      {/* Contenedor consistente */}
      <div className="relative mx-auto max-w-6xl space-y-6">
        {/* HERO */}
        <Surface className="overflow-hidden">
          <div className="p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Dashboard
                </div>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
                  Panel de Entrenador
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                  Rendimiento, eficiencia y foco de trabajo en una sola vista.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge>{DEMO ? "DEMO" : "REAL"}</Badge>
                <Badge>{dataSource === "API" ? "Datos API" : "Datos Demo"}</Badge>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
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
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
              >
                Asistente IA
              </Link>
            </div>
          </div>
        </Surface>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {(loading ? Array.from({ length: 4 }) : kpis).map((k: any, i: number) => (
            <div key={i}>
              {loading ? (
                <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/70 backdrop-blur shadow-sm p-5">
                  <div className="h-4 w-36 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="mt-3 h-9 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="mt-3 h-3 w-44 bg-gray-100 dark:bg-gray-800/60 rounded" />
                </div>
              ) : (
                <Card
                  title={k.label}
                  value={k.value}
                  hint={k.hint}
                  icon={
                    i === 0 ? <Users className="h-5 w-5" /> :
                    i === 1 ? <CalendarDays className="h-5 w-5" /> :
                    i === 2 ? <TrendingUp className="h-5 w-5" /> :
                    <Sparkles className="h-5 w-5" />
                  }
                />
              )}
            </div>
          ))}
        </div>

        {/* Acciones rápidas (vende) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <QuickAction
            href="/panel/players"
            title="Gestionar Jugadores"
            desc="Altas, edición de perfiles y seguimiento del rendimiento."
            icon={<Users className="h-5 w-5" />}
          />
          <QuickAction
            href="/panel/sessions"
            title="Gestionar Sesiones"
            desc="Cargá entrenamientos/partidos y analizá resultados."
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <QuickAction
            href="/panel/assistant"
            title="Asistente IA"
            desc="Recomendaciones y ajustes para quintetos basados en datos."
            icon={<Sparkles className="h-5 w-5" />}
          />
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* TOP (podio) */}
          <div className="xl:col-span-2">
            <TopPlayersPodium players={topPlayers} hrefAll="/panel/players" />
          </div>

          {/* Columna derecha */}
          <div className="space-y-6">
            {/* SESIONES RECIENTES */}
            <Surface>
              <div className="p-6 border-b border-gray-200/70 dark:border-gray-800/80">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-50">
                  Sesiones recientes
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Últimos entrenamientos y partidos.
                </p>
              </div>

              <div className="p-6 space-y-3">
                {recentSessions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-gray-200/70 dark:border-gray-800/80 bg-white/70 dark:bg-gray-950/30 backdrop-blur p-4 hover:shadow-sm transition"
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
                        <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200/70 dark:border-gray-700">
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
            </Surface>
          </div>
        </div>

        {/* Próximas 3 fechas (bloque vendible tipo referencia) */}
        <Surface>
          <div className="p-6 border-b border-gray-200/70 dark:border-gray-800/80 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-50">
                Próximas 3 fechas
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Agenda del equipo para planificar rotación y cargas.
              </p>
            </div>

            <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
              (Próximamente)
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {(upcoming.length ? upcoming : []).slice(0, 3).map((g) => (
              <GameCard key={g.id} g={g} />
            ))}
          </div>
        </Surface>

        {/* Nota técnica */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {dataSource === "DEMO_FALLBACK"
            ? "Mostrando datos DEMO (fallback) porque las APIs no devolvieron datos."
            : "Mostrando datos desde APIs (si faltan campos, se completa con placeholders)."}
        </div>
      </div>
    </div>
  );
}
