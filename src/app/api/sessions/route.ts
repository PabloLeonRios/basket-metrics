// src/app/api/sessions/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Session from '@/lib/models/Session';

// GET: Obtener todas las sesiones de un entrenador
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

    const sessions = await Session.find({ coach: coachId }).sort({ date: -1 });
    return NextResponse.json(
      { success: true, data: sessions },
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

// POST: Crear una nueva sesión
export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const body = await request.json();
    const { name, coach, date, sessionType, teams } = body;

    // Validación básica
    if (!name || !coach || !sessionType || !teams) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Faltan campos requeridos: nombre, coach, sessionType, teams.',
        },
        { status: 400 },
      );
    }

    const newSession = new Session({
      name,
      coach,
      date,
      sessionType,
      teams,
    });

    await newSession.save();

    return NextResponse.json(
      { success: true, data: newSession },
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
