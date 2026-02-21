// src/app/api/sessions/[sessionId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Session from '@/lib/models/Session';
import Player from '@/lib/models/Player'; // Import Player to ensure the model is registered
import { verifyAuth } from '@/lib/auth'; // Importar verifyAuth

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const pathname = request.nextUrl.pathname;
    const parts = pathname.split('/');
    const sessionId = parts[parts.length - 1]; // la URL es /api/sessions/[sessionId]

    const session = await Session.findById(sessionId).populate({
      path: 'teams.players',
      model: Player,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Sesión no encontrada' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: session }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor', error: errorMessage },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  await dbConnect();

  try {
    const token = request.cookies.get('token')?.value;
    const verified = await verifyAuth(token);
    if (!verified.success || !verified.payload) {
      return NextResponse.json(verified, { status: 401 });
    }
    // Solo coaches pueden actualizar sesiones
    if (verified.payload.role !== 'entrenador') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado. Se requiere rol de Entrenador.' },
        { status: 403 },
      );
    }

    const pathname = request.nextUrl.pathname;
    const parts = pathname.split('/');
    const sessionId = parts[parts.length - 1];

    const { finishedAt } = await request.json();

    if (!finishedAt) {
      return NextResponse.json(
        { success: false, message: 'El campo finishedAt es requerido para actualizar la sesión.' },
        { status: 400 },
      );
    }

    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { finishedAt: new Date(finishedAt) }, // Convertir a Date object
      { new: true, runValidators: true },
    );

    if (!updatedSession) {
      return NextResponse.json(
        { success: false, message: 'Sesión no encontrada.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updatedSession }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error al actualizar la sesión', error: errorMessage },
      { status: 500 },
    );
  }
}

