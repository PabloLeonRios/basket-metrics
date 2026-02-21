// src/app/api/game-events/[eventId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import GameEvent from '@/lib/models/GameEvent';
import { verifyAuth } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  await dbConnect();
  const { eventId } = await params;

  try {
    const token = request.cookies.get('token')?.value;
    const verified = await verifyAuth(token);
    if (!verified.success || !verified.payload) {
      return NextResponse.json(verified, { status: 401 });
    }
    // Solo coaches pueden eliminar eventos de sus sesiones
    if (verified.payload.role !== 'entrenador') {
      return NextResponse.json(
        {
          success: false,
          message: 'Acceso denegado. Se requiere rol de Entrenador.',
        },
        { status: 403 },
      );
    }

    const deletedEvent = await GameEvent.findByIdAndDelete(eventId);

    if (!deletedEvent) {
      return NextResponse.json(
        { success: false, message: 'Evento de juego no encontrado.' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: 'Evento eliminado correctamente.' },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        success: false,
        message: 'Error al eliminar el evento.',
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
