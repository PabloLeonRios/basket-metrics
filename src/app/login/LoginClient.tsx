"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * Este componente es SOLO FRONTEND.
 * No depende de MongoDB.
 * El login llama a /api/auth/login
 * que luego se conectará al backend real.
 */

export default function LoginClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push("/panel");
    } else {
      alert("Login incorrecto");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-[380px] bg-white shadow-lg rounded-lg p-8"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Iniciar sesión
        </h1>

        <input
          className="w-full border p-3 mb-4 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-3 mb-6 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-black text-white p-3 rounded">
          Login
        </button>
      </form>
    </div>
  );
}