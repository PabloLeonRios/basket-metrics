// src/app/panel/layout.tsx
"use client";

import { useEffect, PropsWithChildren, useMemo, useState } from "react";
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
 * - Esto NO reemplaza la seguridad real: es solo para UX/UI y demo local.
 */

type DemoUser = {
  name?: string;
  email?: string;
  role?: string;
  team?: { name?: string } | null;
  demo?: boolean;
};

export default function PanelLayout({ children }: PropsWithChildren) {
  const router = useRouter();

  const { user, loading, isAuthenticated } = useAuth();

  const DEMO_MODE = useMemo(() => {
    return process.env.NEXT_PUBLIC_DEMO_MODE === "1";
  }, []);

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
      const parsed = JSON.parse(raw) as DemoUser;
      setDemoUser(parsed);
    } catch {
      setDemoUser(null);
    }
  }, [DEMO_MODE]);

  const effectiveIsAuthenticated = DEMO_MODE ? isAuthenticated || !!demoUser : isAuthenticated;
  const effectiveLoading = DEMO_MODE ? loading : loading;

  const effectiveUser: any = DEMO_MODE && !isAuthenticated ? demoUser : user;

  useEffect(() => {
    if (!effectiveLoading && !effectiveIsAuthenticated) {
      router.push("/login");
    }
  }, [effectiveLoading, effectiveIsAuthenticated, router]);

  const handleLogout = async () => {
    /**
     * ============================
     *  NOTAS PARA PABLITO (Mongo)
     * ============================
     * DEMO: no pegamos a /api/auth/logout (porque no hay sesión real).
     * PROD: se mantiene logout original.
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

  if (effectiveLoading || !effectiveIsAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex relative">
      {/* Sidebar Backdrop for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/80 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:sticky md:top-0 h-screen bg-white dark:bg-gray-900 shadow-md transition-all duration-300 ease-in-out flex-shrink-0 ${
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden"
        }`}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800 px-4 min-w-[16rem]">
          <Link href="/panel" className="flex items-center gap-2 font-bold text-xl text-orange-600">
            <Dribbble className="w-6 h-6 text-orange-500" />
            <span>Basket-Metrics</span>
          </Link>
        </div>

        <Sidebar
          user={effectiveUser}
          isSidebarOpen={isSidebarOpen}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Sidebar Toggle Button */}
              <button
                type="button"
                className="-ml-2 flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <span className="sr-only">Toggle sidebar</span>
                {isSidebarOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    Hola, {effectiveUser?.name ?? "Usuario"}
                  </span>

                  {/* Mantengo tu lógica original del team si es entrenador */}
                  {effectiveUser?.role === "entrenador" && effectiveUser?.team && (
                    <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 text-base font-semibold rounded-full dark:bg-orange-900 dark:text-orange-200 shadow-sm">
                      {effectiveUser.team.name}
                    </span>
                  )}

                  {/* Badge DEMO */}
                  {DEMO_MODE && (
                    <span className="px-2.5 py-0.5 bg-gray-200 text-gray-800 text-xs font-semibold rounded-full dark:bg-gray-800 dark:text-gray-200">
                      DEMO
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}