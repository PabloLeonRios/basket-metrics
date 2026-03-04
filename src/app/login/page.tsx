import { Suspense } from "react";
import LoginClient from "./LoginClient";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * Este wrapper existe porque Next 16 exige
 * Suspense para componentes client que usan
 * router o search params.
 */

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginClient />
    </Suspense>
  );
}