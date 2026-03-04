"use client";

import { useMemo, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ROLES } from "@/lib/constants";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * MODO DEMO:
 * - Si NEXT_PUBLIC_DEMO_MODE="1", el login NO llama a /api/auth/login.
 * - En su lugar, guarda una "sesión demo" en localStorage y navega a /panel.
 * - Middleware en DEMO no exige JWT.
 *
 * PROD/REAL:
 * - Cuando DEMO está apagado, queda el flujo original (fetch + rol).
 */

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const search = useSearchParams();

  const DEMO_MODE = useMemo(() => {
    return process.env.NEXT_PUBLIC_DEMO_MODE === "1";
  }, []);

  const registered = search.get("registered") === "true";

  const goDemo = (role: "COACH" | "ADMIN" = "COACH") => {
    try {
      localStorage.setItem(
        "basket_demo_user",
        JSON.stringify({
          name: role === "ADMIN" ? "Admin Demo" : "Coach Demo",
          email: role === "ADMIN" ? "admin@demo.local" : "coach@demo.local",
          role: role === "ADMIN" ? ROLES.ADMIN : ROLES.COACH,
          demo: true,
          createdAt: Date.now(),
        })
      );
    } catch {
      // si localStorage falla, igual intentamos navegar
    }

    if (role === "ADMIN") router.push("/panel/admin/users");
    else router.push("/panel");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // DEMO: no pegamos a Mongo
    if (DEMO_MODE) {
      // si el usuario pone algo tipo "admin", lo mandamos como admin demo
      const isAdminHint =
        email.toLowerCase().includes("admin") || password.toLowerCase().includes("admin");
      goDemo(isAdminHint ? "ADMIN" : "COACH");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión.");
      }

      // Redirigir según el rol
      if (data.data.role === ROLES.ADMIN) {
        router.push("/panel/admin/users");
      } else {
        router.push("/panel");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyles =
    "w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow";
  const labelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-950 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50">
          Iniciar Sesión
        </h1>

        {registered && (
          <div className="text-sm text-center rounded-lg border border-green-200 bg-green-50 text-green-800 px-4 py-3 dark:border-green-900/40 dark:bg-green-950/40 dark:text-green-200">
            Cuenta creada. Ahora podés iniciar sesión.
          </div>
        )}

        {DEMO_MODE && (
          <div className="text-sm text-center rounded-lg border border-orange-200 bg-orange-50 text-orange-800 px-4 py-3 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-200">
            Modo DEMO activo (sin Mongo). Podés entrar directo al panel.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={labelStyles}>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputStyles}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className={labelStyles}>
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputStyles}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors shadow-md hover:shadow-lg disabled:bg-gray-400"
            >
              {loading ? "Iniciando..." : DEMO_MODE ? "Entrar (DEMO)" : "Iniciar Sesión"}
            </button>

            {DEMO_MODE && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => goDemo("COACH")}
                  className="w-full px-4 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Entrar como Coach
                </button>
                <button
                  type="button"
                  onClick={() => goDemo("ADMIN")}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700"
                >
                  Entrar como Admin
                </button>
              </div>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-orange-600 hover:text-orange-500 hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}