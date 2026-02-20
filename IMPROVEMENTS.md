# Propuestas de Mejora para Basket Metrics (Fase 2)

## 1. Experiencia de Usuario (UX)

- **Notificaciones "Toast":** Reemplazar los `alert()` nativos por notificaciones no intrusivas (toasts).
  - _Herramienta sugerida:_ `sonner` o `react-hot-toast`.
  - _Beneficio:_ Feedback visual moderno sin interrumpir el flujo del usuario.
- **Feedback de Carga (Skeletons):** Implementar "Skeleton Screens" en lugar de textos simples "Cargando..." para mejorar la percepción de velocidad.
  - _Beneficio:_ Reduce la fatiga visual y da sensación de progreso inmediato.

## 2. Funcionalidades para Entrenadores

- **Exportación de Reportes (PDF/CSV):**
  - Permitir descargar fichas de jugadores y estadísticas de partidos en formato PDF para compartir.
  - Exportar datos crudos a CSV para análisis en Excel.
  - _Herramienta sugerida:_ `jspdf` o `react-pdf`.
- **Comparador de Jugadores:**
  - Nueva vista `/panel/compare` donde se puedan seleccionar 2 o más jugadores y ver sus estadísticas (TS%, eFG%, etc.) en un gráfico de radar o barras lado a lado.
  - _Herramienta sugerida:_ `recharts` (ya usado en el proyecto, extender su uso).

## 3. Seguridad y Robustez

- **Gestión de Errores Global:** Implementar un `ErrorBoundary` en React para capturar fallos inesperados en la UI sin romper toda la aplicación.
- **Validación de Variables de Entorno:** Utilizar `zod` para validar que todas las variables de entorno necesarias (DB, JWT, etc.) existan al iniciar la aplicación, fallando rápido y con mensajes claros.

## 4. Gestión de Equipos y Usuarios

- **Múltiples Equipos:** Permitir que un entrenador gestione más de un equipo.
- **Roles Granulares:** Añadir rol de "Asistente" con permisos de lectura/escritura limitados (e.g., puede anotar en el tracker pero no borrar partidos).
