'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * BYPASS TOTAL TEMPORAL
 * Demo/rediseño: salta siempre al panel.
 * Después volver a auth real.
 */
const BYPASS_LOGIN = true;

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (BYPASS_LOGIN) {
      router.replace('/panel/dashboard');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <p className="text-gray-700">Redirigiendo al panel...</p>
    </div>
  );
}