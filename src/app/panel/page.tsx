// src/app/panel/page.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import PlayerProfile from "@/components/players/PlayerProfile";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * MODO DEMO (sin Mongo):
 * - `useAuth()` normalmente depende de JWT/API/Mongo.
 * - En DEMO, `useAuth()` puede devolver user=null (sin sesión real),
 *   lo que dejaba esta página con loader infinito.
 *
 * Fix DEMO:
 * - Si NEXT_PUBLIC_DEMO_MODE="1" y user==null, intentamos leer `basket_demo_user`
 *   desde localStorage (lo crea /login en DEMO).
 * - Con eso podemos redirigir a /panel/dashboard (coach) y evitar el spinner eterno.
 *
 * PROD/REAL:
 * - DEMO apagado => comportamiento original (solo useAuth).
 */

type DemoUser = {
  name?: string;
  email?: string;
  role?: string; // "entrenador" | "jugador" | "admin" (según app)
  team?: { name?: string } | null;
  demo?: boolean;
};

export default function PanelPage() {
  const { user, loading: authLoading } = useAuth();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const DEMO_MODE = useMemo(() => {
    return process.env.NEXT_PUBLIC_DEMO_MODE === "1";
  }, []);

  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  // Cargar demo user (si existe) para poder “espejar” sin Mongo
  useEffect(() => {
    if (!DEMO_MODE) return;

    try {
      const raw = localStorage.getItem("basket_demo_user");
      if (!raw) {
        setDemoUser(null);
        return;
      }
      setDemoUser(JSON.parse(raw));
    } catch {
      setDemoUser(null);
    }
  }, [DEMO_MODE]);

  // En DEMO, si useAuth no trae user, usamos el demoUser
  const effectiveUser: any = DEMO_MODE && !user ? demoUser : user;

  useEffect(() => {
    if (authLoading) return;

    // Si no hay user real ni demoUser, soltamos el loader (layout ya te redirige igual)
    if (!effectiveUser) {
      setLoading(false);
      return;
    }

    // Redireccionar según el rol
    if (effectiveUser.role === "admin") {
      router.replace("/panel/admin/users");
      return;
    }
    if (effectiveUser.role === "entrenador") {
      router.replace("/panel/dashboard");
      return;
    }

    // Si es jugador, buscar su perfil
    const fetchPlayerProfile = async () => {
      /**
       * ============================
       *  NOTAS PARA PABLITO (Mongo)
       * ============================
       * DEMO:
       * - Sin API/Mongo no tenemos /api/me/player-profile real.
       * - Para espejo completo, lo ideal es mockear ese endpoint.
       * - Por ahora: intentamos fetch real; si falla, salimos del loader con mensaje.
       */
      try {
        const playerProfileRes = await fetch("/api/me/player-profile");
        if (!playerProfileRes.ok) throw new Error("Perfil de jugador no encontrado.");
        const { data: playerProfileData } = await playerProfileRes.json();
        setPlayerId(playerProfileData._id);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (effectiveUser.role === "jugador") {
      fetchPlayerProfile();
    } else {
      setLoading(false);
    }
  }, [effectiveUser, authLoading, router]);

  // Loader mientras decide redirección o carga perfil
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Solo los jugadores se quedan en esta página
  return (
    <div className="space-y-6">
      {effectiveUser?.role === "jugador" && playerId ? (
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Mi Perfil de Jugador
          </h1>
          <PlayerProfile playerId={playerId} />
        </div>
      ) : (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Listo. Si sos entrenador, ya deberías estar en Dashboard. Si sos jugador,
            falta mockear el endpoint de perfil para espejo completo.
          </p>
        </div>
      )}
    </div>
  );
}