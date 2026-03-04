// src/app/panel/page.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import PlayerProfile from "@/components/players/PlayerProfile";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isDemoMode } from "@/lib/demo";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * Objetivo: que /panel sea un "router inteligente".
 *
 * MODO DEMO (sin Mongo):
 * - `useAuth()` puede devolver user=null porque no hay JWT real / DB.
 * - Para evitar loader infinito, leemos `basket_demo_user` desde localStorage
 *   (lo crea /login en DEMO).
 *
 * PROD/REAL (con Mongo):
 * - DEMO apagado => comportamiento original (solo useAuth + API real).
 *
 * Nota:
 * - Esta página NO renderiza un dashboard real.
 * - Solo redirige según rol y, si es jugador, intenta cargar su perfil.
 */

type DemoUser = {
  name?: string;
  email?: string;
  role?: string; // "entrenador" | "jugador" | "admin"
  team?: { name?: string } | null;
  demo?: boolean;
};

export default function PanelPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1) DEMO: intentar levantar usuario simulado desde localStorage
  useEffect(() => {
    if (!isDemoMode()) return;

    try {
      const raw = localStorage.getItem("basket_demo_user");
      setDemoUser(raw ? JSON.parse(raw) : null);
    } catch {
      setDemoUser(null);
    }
  }, []);

  // 2) User efectivo (real o demo)
  const effectiveUser: any = isDemoMode() && !user ? demoUser : user;

  // 3) Redirecciones por rol + carga de perfil jugador
  useEffect(() => {
    if (authLoading) return;

    // Si no hay user real ni demo: liberamos loader y mostramos CTA a login.
    if (!effectiveUser) {
      setLoading(false);
      return;
    }

    // Admin
    if (effectiveUser.role === "admin") {
      router.replace("/panel/admin/users");
      return;
    }

    // Entrenador
    if (effectiveUser.role === "entrenador") {
      router.replace("/panel/dashboard");
      return;
    }

    // Jugador: buscar perfil (en DEMO puede fallar si no mockeamos el endpoint)
    const fetchPlayerProfile = async () => {
      /**
       * ============================
       *  NOTAS PARA PABLITO (Mongo)
       * ============================
       * REAL:
       * - /api/me/player-profile usa Mongo.
       * DEMO:
       * - Ideal: mockear /api/me/player-profile para "espejo" completo.
       * - Mientras tanto: si falla, salimos del loader y mostramos mensaje.
       */
      try {
        const res = await fetch("/api/me/player-profile", { cache: "no-store" });
        if (!res.ok) throw new Error("Perfil de jugador no encontrado.");
        const { data } = await res.json();
        setPlayerId(data._id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (effectiveUser.role === "jugador") {
      fetchPlayerProfile();
    } else {
      setLoading(false);
    }
  }, [authLoading, effectiveUser, router]);

  // Loader (unificado y prolijo)
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-5 py-4 shadow-sm">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600" />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Cargando panel…
          </div>
        </div>
      </div>
    );
  }

  // Caso: sin sesión (real ni demo)
  if (!effectiveUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
            No hay sesión activa
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isDemoMode()
              ? "Estás en DEMO. Entrá por /login para generar el usuario demo."
              : "Iniciá sesión para acceder al panel."}
          </p>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition"
            >
              Ir a Login
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold hover:opacity-90 transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Jugador con perfil
  if (effectiveUser?.role === "jugador" && playerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Mi Perfil de Jugador
        </h1>
        <PlayerProfile playerId={playerId} />
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm text-center">
        <p className="text-gray-700 dark:text-gray-300">
          Listo. Si sos entrenador, ya deberías estar en <b>Dashboard</b>.
          <br />
          Si sos jugador, falta mockear <code>/api/me/player-profile</code> para espejo completo.
        </p>

        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={() => router.push("/panel/dashboard")}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
