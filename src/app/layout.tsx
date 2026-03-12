'use client';

import { PropsWithChildren, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dribbble } from 'lucide-react';
import type { AuthUser } from '@/hooks/useAuth';

/**
 * BYPASS TOTAL TEMPORAL
 * Demo/rediseño: no valida auth real.
 * Después volver a useAuth + redirect a login.
 */
const BYPASS_LOGIN = true;

const DEMO_USER: AuthUser = {
  _id: 'demo-entrenador',
  name: 'Pablo Dev',
  email: 'demo@basketmetrics.com',
  role: 'entrenador',
  isActive: true,
  team: {
    _id: 'demo-team',
    name: 'Dev Team',
    logoUrl: '',
  } as AuthUser['team'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function PanelLayout({ children }: PropsWithChildren) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const user = DEMO_USER;

  const handleLogout = async () => {
    if (BYPASS_LOGIN) {
      window.location.href = '/panel/dashboard';
      return;
    }

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Fallo al cerrar sesión en el servidor', error);
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_24%),linear-gradient(to_bottom,_#08101b,_#060b14_42%,_#050912)]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 h-screen shrink-0 transition-all duration-300 ease-out md:sticky md:top-0 ${
            isSidebarOpen
              ? 'w-[290px] translate-x-0'
              : 'w-0 -translate-x-full overflow-hidden md:w-[92px] md:translate-x-0'
          }`}
        >
          <div className="flex h-full flex-col border-r border-white/10 bg-[#0a1220]/92 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
              <Link href="/panel" className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-950/50">
                  <Dribbble className="h-5 w-5 text-white" />
                </div>

                {isSidebarOpen && (
                  <div className="min-w-0">
                    <p className="truncate text-[11px] uppercase tracking-[0.24em] text-orange-300/80">
                      Performance Suite
                    </p>
                    <h1 className="truncate text-base font-semibold text-white">
                      Basket Metrics
                    </h1>
                  </div>
                )}
              </Link>

              <button
                type="button"
                className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
              >
                {isSidebarOpen ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <Bars3Icon className="h-5 w-5" />
                )}
              </button>
            </div>

            <Sidebar
              user={user as any}
              isSidebarOpen={isSidebarOpen}
              handleLogout={handleLogout}
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#08111d]/80 backdrop-blur-xl">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex h-20 items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08] hover:text-white md:hidden"
                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                  >
                    {isSidebarOpen ? (
                      <XMarkIcon className="h-6 w-6" />
                    ) : (
                      <Bars3Icon className="h-6 w-6" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking
