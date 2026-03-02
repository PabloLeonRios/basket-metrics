// src/app/api/stats/[sessionId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TeamGameStats from '@/lib/models/TeamGameStats';

// Asumimos que el middleware protege esta ruta

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  await dbConnect();

  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Se requiere el ID de la sesión.' },
        { status: 400 },
      );
    }

    const teamStats = await TeamGameStats.find({ session: sessionId });

    if (!teamStats || teamStats.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No se encontraron estadísticas para esta sesión. Asegúrate de haberlas calculado.',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, data: { teamStats } },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor', error: errorMessage },
      { status: 500 },
    );
  }
}
