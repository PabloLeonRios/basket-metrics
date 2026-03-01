// src/app/api/sessions/[sessionId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Session from '@/lib/models/Session';
import Player from '@/lib/models/Player';
import GameEvent from '@/lib/models/GameEvent'; // Importar GameEvent
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  await dbConnect();
  try {
    const { sessionId } = await params;
    const session = await Session.findById(sessionId).populate({
      path: 'teams.players',
      model: Player,
    });
    if (!session) {
      return NextResponse.json({ success: false, message: 'Sesión no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: session }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, message: 'Error en el servidor', error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  await dbConnect();
  try {
    const token = request.cookies.get('token')?.value;
    const verified = await verifyAuth(token);
    if (!verified.success || !verified.payload || verified.payload.role !== 'entrenador') {
      return NextResponse.json({ success: false, message: 'Acceso denegado.' }, { status: 403 });
    }

    const { sessionId } = await params;
    const body = await request.json();

    const updateData: { [key: string]: any } = {};
    if (body.finishedAt) updateData.finishedAt = new Date(body.finishedAt);
    if (body.currentQuarter) updateData.currentQuarter = body.currentQuarter;
    if (body.name) updateData.name = body.name;
    if (body.sessionType) updateData.sessionType = body.sessionType;
    if (body.teams) updateData.teams = body.teams;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ success: false, message: 'No hay datos para actualizar.' }, { status: 400 });
    }

    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true },
    ).populate({
      path: 'teams.players',
      model: Player,
    });

    if (!updatedSession) {
      return NextResponse.json({ success: false, message: 'Sesión no encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updatedSession }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, message: 'Error al actualizar la sesión', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  await dbConnect();
  try {
    const token = request.cookies.get('token')?.value;
    const verified = await verifyAuth(token);
    if (!verified.success || !verified.payload || verified.payload.role !== 'entrenador') {
      return NextResponse.json({ success: false, message: 'Acceso denegado.' }, { status: 403 });
    }

    const { sessionId } = await params;

    // Verificar si hay eventos de juego asociados
    const eventCount = await GameEvent.countDocuments({ session: sessionId });
    if (eventCount > 0) {
      return NextResponse.json(
        { success: false, message: 'No se puede eliminar una sesión con eventos de juego registrados.' },
        { status: 400 },
      );
    }

    const deletedSession = await Session.findByIdAndDelete(sessionId);

    if (!deletedSession) {
      return NextResponse.json({ success: false, message: 'Sesión no encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Sesión eliminada correctamente.' }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, message: 'Error al eliminar la sesión', error: errorMessage }, { status: 500 });
  }
}
