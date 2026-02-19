// src/app/api/players/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Player from '@/lib/models/Player';
import User from '@/lib/models/User';
import { NextRequest } from 'next/server';

// GET: Obtener todos los jugadores de un entrenador
export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');

    if (!coachId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Se requiere el ID del entrenador (coachId).',
        },
        { status: 400 },
      );
    }

    const players = await Player.find({ coach: coachId });
    return NextResponse.json({ success: true, data: players }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor', error: errorMessage },
      { status: 500 },
    );
  }
}

// POST: Crear un nuevo jugador
export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const { name, dorsal, position, team, coach } = await request.json();

    if (!name || !coach) {
      return NextResponse.json(
        {
          success: false,
          message: 'El nombre y el ID del entrenador son requeridos.',
        },
        { status: 400 },
      );
    }

    // --- Simplificación Temporal ---
    // En un futuro, aquí iría un sistema de invitación por email.
    // Por ahora, creamos un usuario placeholder para el jugador.
    const placeholderEmail = `${name.replace(/\s+/g, '.').toLowerCase()}.${Date.now()}@basketmetrics.local`;
    const placeholderPassword = Math.random().toString(36).slice(-8);

    const newUser = new User({
      name,
      email: placeholderEmail,
      password: placeholderPassword, // En el futuro hashearíamos esto con bcrypt
      role: 'jugador',
    });
    await newUser.save();
    // --- Fin de la Simplificación ---

    const newPlayer = new Player({
      user: newUser._id,
      coach,
      name,
      dorsal,
      position,
      team,
    });

    await newPlayer.save();

    return NextResponse.json(
      { success: true, data: newPlayer },
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
