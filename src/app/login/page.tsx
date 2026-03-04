// src/app/login/page.tsx
"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * Objetivo: Login SIMPLE que destrabe el acceso al Panel.
 *
 * MODO DEMO (sin Mongo):
 * - Acepta CUALQUIER email/contraseña.
 * - NO llama a backend.
 * - Guarda un usuario demo en localStorage bajo la key: "basket_demo_user"
 * - Redirige a /panel (el PanelLayout/PanelPage ya leen esa key).
 *
 * MODO REAL (Mongo):
 * - Debe llamar a POST /api/auth/login con credenciales reales.
 * - Ese endpoint en REAL debería:
 *   - validar usuario en Mongo
 *   - emitir cookie/JWT
 *   - `useAuth()` leer la sesión real desde backend
 *
 * Importante:
 * - Esto no reemplaza seguridad real; solo destraba UX/UI en DEMO.
 */

type DemoUser = {
  name?: string;
  email?: string;
  role?: "entrenador" | "jugador" | "admin";
  team?: { name?: string } | null;
  demo?: boolean;
};

function isDemoModeClient() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}

function roleFromEmail(email: string): DemoUser["role"] {
  const e = (email || "").toLowerCase();
  if (e.includes("admin")) return "admin";
  if (e.includes("jugador") || e.includes("player")) return "jugador";
  return "entrenador";
}

function prettyNameFromEmail(email: string) {
  const base = (email || "").split("@")[0] || "Demo";
  const clean = base.replace(/[._-]+/g, " ").trim();
  return clean ? clean[0].toUpperCase() + clean.slice(1) : "Demo";
}

export default function LoginPage() {
  const router = useRouter();

  const DEMO_MODE = useMemo(() => isDemoModeClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // ✅ DEMO: cualquier mail/contraseña
    if (DEMO_MODE) {
      try {
        const role = roleFromEmail(email);
        const demoUser: DemoUser = {
          name: prettyNameFromEmail(email),
          email: email || "demo@basket.local",
          role,
          team: role === "entrenador" ? { name: "Demo Team" } : null,
          demo: true,
        };

        localStorage.setItem("basket_demo_user", JSON.stringify(demoUser));
        router.replace("/panel");
        return;
      } catch {
        setError("No se pudo crear la sesión DEMO.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // REAL: login por API
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.error || "Credenciales inválidas o servidor no disponible.");
        return;
      }

      router.replace("/panel");
    } catch {
      setError("No se pudo conectar al servidor. Probá nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 text-center">
          Iniciar sesión
        </h1>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          {DEMO_MODE
            ? "DEMO activo: podés entrar con cualquier mail y contraseña."
            : "Ingresá con tus credenciales."}
        </p>

        {DEMO_MODE && (
          <div className="mt-4 rounded-xl border border-orange-200/70 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/30 px-4 py-3 text-sm text-orange-900 dark:text-orange-200">
            Tip rápido: si el mail contiene <b>admin</b> → entra como Admin. Si contiene{" "}
            <b>jugador</b> o <b>player</b> → entra como Jugador. Si no, entra como Entrenador.
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@basket.com"
              type="email"
              className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            disabled={submitting}
            className="w-full rounded-xl bg-orange-600 text-white font-semibold py-3 hover:bg-orange-700 transition disabled:opacity-60"
          >
            {submitting ? "Ingresando…" : "Login"}
          </button>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:underline"
            >
              Volver al inicio
            </button>

            {DEMO_MODE && (
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem("basket_demo_user");
                  } catch {}
                  setEmail("");
                  setPassword("");
                  setError(null);
                }}
                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:underline"
              >
                Limpiar DEMO
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
