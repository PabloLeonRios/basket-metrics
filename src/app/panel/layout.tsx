// src/app/panel/layout.tsx
"use client";

import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Dribbble } from "lucide-react";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * MODO DEMO (sin Mongo):
 * - Este layout originalmente depende de `useAuth()` (JWT + API + Mongo).
 * - En DEMO queremos poder diseñar/probar el Panel sin backend.
 *
 * Qué hace este layout en DEMO:
 * - Si NEXT_PUBLIC_DEMO_MODE="1" y NO hay auth real, intenta leer un usuario demo
 *   desde localStorage (key: "basket_demo_user") creado en /login.
 * - Si existe, permite entrar al panel y usa ese user para Sidebar y saludo.
 *
 * En PROD/REAL:
 * - DEMO apagado => se comporta como el original (requiere isAuthenticated).
 *
 * Nota:
 * - Esto NO reemplaza la seguridad real: es solo para UX/UI y demo.
 */

type DemoUser = {
  name?: string;
  email?: string;
  role?: string;
  team?: { name?: string } | null;
  demo?: boolean;
};

function PanelLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center gap-3 rounded-2xl bg-white/90 dark:bg-gray-900/80 border border-gray-200/70 dark:border-gray-800 px-5 py-4 shadow-sm">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600" />
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Cargando panel…
        </div>
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  const DEMO_MODE = useMemo(() => process.env.NEXT_PUBLIC_DEMO_MODE === "1", []);

  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Cargar user demo si DEMO_MODE está activo
  useEffect(() => {
    if (!DEMO_MODE) return;

    try {
      const raw = localStorage.getItem("basket_demo_user");
      if (!raw) {
        setDemoUser(null);
        return;
      }
      setDemoUser(JSON.parse(raw) as DemoUser);
    } catch {
      setDemoUser(null);
    }
  }, [DEMO_MODE]);

  // "User efectivo" para render (real o demo)
  const effectiveIsAuthenticated = DEMO_MODE ? isAuthenticated || !!demoUser : isAuthenticated;
  const effectiveUser: any = DEMO_MODE && !isAuthenticated ? demoUser : user;

  useEffect(() => {
    if (!loading && !effectiveIsAuthenticated) {
      router.push("/login");
    }
  }, [loading, effectiveIsAuthenticated, router]);

  const handleLogout = async () => {
    /**
     * ============================
     *  NOTAS PARA PABLITO (Mongo)
     * ============================
     * DEMO: no pegamos a /api/auth/logout (porque no hay sesión real).
     * PROD: se mantiene logout original (API real).
     */
    if (DEMO_MODE) {
      try {
        localStorage.removeItem("basket_demo_user");
      } catch {}
      window.location.href = "/login";
      return;
    }

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Fallo al cerrar sesión en el servidor", error);
    } finally {
      window.location.href = "/login";
    }
  };

  // Loader / guard
  if (loading || !effectiveIsAuthenticated) return <PanelLoader />;

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Backdrop mobile */}
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-gray-900/60 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Cerrar sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 md:sticky md:top-0 h-screen flex-shrink-0",
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
          "transition-all duration-300 ease-in-out",
          isSidebarOpen
            ? "w-64 translate-x-0 shadow-lg md:shadow-none"
            : "w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden",
        ].join(" ")}
      >
        <div className="h-16 flex items-center justify-center px-4 min-w-[16rem] border-b border-gray-200 dark:border-gray-800">
          <Link
            href="/panel"
            className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-gray-50"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
              <Dribbble className="w-5 h-5" />
            </span>
            <span className="tracking-tight">
              Basket<span className="text-orange-600">Metrics</span>
            </span>
          </Link>
        </div>

        <Sidebar user={effectiveUser} isSidebarOpen={isSidebarOpen} handleLogout={handleLogout} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/85 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Toggle */}
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60 transition"
                  onClick={() => setIsSidebarOpen((v) => !v)}
                >
                  <span className="sr-only">Toggle sidebar</span>
                  {isSidebarOpen ? (
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>

                <div className="hidden sm:block">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Panel
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-gray-50 leading-tight">
                    {effectiveUser?.role === "admin"
                      ? "Administración"
                      : effectiveUser?.role === "entrenador"
                      ? "Entrenador"
                      : "Jugador"}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3">
                {effectiveUser?.role === "entrenador" && effectiveUser?.team?.name && (
                  <span className="hidden sm:inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border border-orange-200/60 dark:border-orange-800/60">
                    {effectiveUser.team.name}
                  </span>
                )}

                {DEMO_MODE && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                    DEMO
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <div className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Hola, {effectiveUser?.name ?? "Usuario"}
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-gray-200 dark:bg-gray-800 border border-gray-300/40 dark:border-gray-700 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200">
                    {(effectiveUser?.name?.[0] ?? "U").toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {/* “Surface” para que TODO se vea pro aunque cada página sea simple */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-4 md:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
