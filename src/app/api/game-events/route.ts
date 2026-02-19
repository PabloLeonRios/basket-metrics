// src/app/api/game-events/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import GameEvent from '@/lib/models/GameEvent';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { session, player, team, type, details } = body;

    // Validación básica
    if (!session || !player || !team || !type) {
      return NextResponse.json(
        { success: false, message: 'Faltan campos requeridos' },
        { status: 400 },
      );
    }

    const newEvent = new GameEvent({
      session,
      player,
      team,
      type,
      details,
    });

    await newEvent.save();

    return NextResponse.json(
      { success: true, data: newEvent },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          {
            success: false,
            message: 'Error de validación',
            error: error.message,
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          success: false,
          message: 'Error en el servidor',
          error: error.message,
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Error en el servidor',
        error: 'Error desconocido',
      },
      { status: 500 },
    );
  }
}
