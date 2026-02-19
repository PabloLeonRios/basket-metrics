// src/app/api/sessions/[sessionId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Session from '@/lib/models/Session';
import Player from '@/lib/models/Player'; // Import Player to ensure the model is registered

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
