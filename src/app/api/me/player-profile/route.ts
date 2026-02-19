// src/app/api/me/player-profile/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Player from '@/lib/models/Player';
import { getAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const { payload } = await getAuth(request);

    if (!payload || !payload.id) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 },
      );
    }

    // Buscar el perfil de Jugador que corresponde al ID de Usuario del token
    const playerProfile = await Player.findOne({ user: payload.id }).select(
      '_id',
    );

    if (!playerProfile) {
      return NextResponse.json(
        {
          success: false,
          message: 'Perfil de jugador no encontrado para este usuario.',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, data: playerProfile },
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
