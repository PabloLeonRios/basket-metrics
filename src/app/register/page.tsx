"use client";

import { useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isPasswordStrong, passwordPolicyMessage } from "@/lib/password-policy";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * MODO DEMO:
 * - Si NEXT_PUBLIC_DEMO_MODE="1", el register NO llama a /api/auth/register.
 * - Guarda el "usuario demo" en localStorage (solo para pruebas de UI)
 *   y redirige al login con ?registered=true.
 *
 * PROD/REAL:
 * - Con DEMO apagado, queda el flujo original (fetch a /api/auth/register).
 */

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const DEMO_MODE = useMemo(() => {
    return process.env.NEXT_PUBLIC_DEMO_MODE === "1";
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isPasswordStrong(password)) {
      setError(passwordPolicyMessage);
      setLoading(false);
      return;
    }

    // DEMO: no pegamos a Mongo
    if (DEMO_MODE) {
      try {
        const raw = localStorage.getItem("basket_demo_users");
        const list = raw ? (JSON.parse(raw) as any[]) : [];
        list.push({
          name,
          email,
          // en DEMO guardamos solo para test visual; no es seguridad real
          password,
          demo: true,
          createdAt: Date.now(),
        });
        localStorage.setItem("basket_demo_users", JSON.stringify(list));
      } catch {
        // si falla localStorage igual redirigimos
      }

      router.push("/login?registered=true");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar la cuenta.");
      }

      // Si el registro es exitoso, redirigir a login para que inicie sesión
      router.push("/login?registered=true");
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
          Crear Cuenta
        </h1>

        {DEMO_MODE && (
          <div className="text-sm text-center rounded-lg border border-orange-200 bg-orange-50 text-orange-800 px-4 py-3 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-200">
            Modo DEMO activo (sin Mongo). Este registro es solo para pruebas de UI.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className={labelStyles}>
              Nombre Completo
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputStyles}
              required
            />
          </div>
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

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors shadow-md hover:shadow-lg disabled:bg-gray-400"
            >
              {loading ? "Registrando..." : DEMO_MODE ? "Crear Cuenta (DEMO)" : "Crear Cuenta"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-orange-600 hover:text-orange-500 hover:underline"
          >
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}