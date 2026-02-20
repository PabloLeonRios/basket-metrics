// src/app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <main className="max-w-4xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            Basket <span className="text-orange-500">Metrics</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Analítica avanzada para entrenadores y jugadores de baloncesto. Toma
            decisiones basadas en datos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-orange-600 text-white font-bold rounded-xl text-lg hover:bg-orange-700 transition-all shadow-lg hover:shadow-orange-500/20"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 font-bold rounded-xl text-lg border-2 border-gray-200 dark:border-gray-800 hover:border-orange-500 transition-all shadow-md"
          >
            Registrarse
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-bold mb-2">Game Tracker</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Registra eventos en vivo con nuestro tracker interactivo.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-bold mb-2">Analítica Avanzada</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Visualiza TS%, eFG% y Game Score de tus jugadores.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-bold mb-2">Asistente IA</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Obtén recomendaciones inteligentes para tus quintetos.
            </p>
          </div>
        </div>
      </main>

      <footer className="absolute bottom-8 text-gray-500 text-sm">
        © {new Date().getFullYear()} Basket Metrics. Todos los derechos
        reservados.
      </footer>
    </div>
  );
}
