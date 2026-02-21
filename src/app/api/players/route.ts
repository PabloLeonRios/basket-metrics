// src/app/api/players/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Player from '@/lib/models/Player';
import User from '@/lib/models/User';
import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';

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
  console.log('--- PLAYER CREATION REQUEST START ---');
  console.log('Calling dbConnect...');
  await dbConnect();
  console.log('dbConnect successful.');
  try {
    const { name, dorsal, position, team, coach } = await request.json();
    console.log('Step 1: Payload received:', { name, team, coach });

    if (!name || !coach) {
      console.error('Validation failed: name or coach missing.');
      return NextResponse.json(
        {
          success: false,
          message: 'El nombre y el ID del entrenador son requeridos.',
        },
        { status: 400 },
      );
    }

    console.log('Step 2: Hashing password...');
    const placeholderPassword = Math.random().toString(36).slice(-8);
    console.log('Before bcrypt.hash...');
    const hashedPassword = await bcrypt.hash(placeholderPassword, 10);
    console.log('After bcrypt.hash. Step 2 Complete: Password hashed.');
    
    console.log('Step 3: Finding coach user...');
    console.log('Before User.findById(coach)...');
    const coachUser = await User.findById(coach).select('team');
    console.log('After User.findById(coach).');
    if (!coachUser) {
        console.error('Coach not found!');
        return NextResponse.json({ success: false, message: 'Entrenador no encontrado.' }, { status: 404 });
    }
    console.log('Step 3 Complete: Coach found.');

    console.log('Step 4: Creating placeholder user object...');
    const randomString = Math.random().toString(36).substring(2, 10);
    const placeholderEmail = `player.${randomString}.${Date.now()}@basketmetrics.local`;
    console.log('Before new User({...})...');
    const newUser = new User({
      name,
      email: placeholderEmail,
      password: hashedPassword,
      role: 'jugador',
      isActive: false, // El jugador se crea como inactivo por defecto
      team: coachUser.team, // Asignar el equipo del entrenador
    });
    console.log('After new User({...}). Step 4 Complete: User object created.');

    console.log('Step 5: Saving new user...');
    console.log('Before newUser.save()...');
    await Promise.race([
      newUser.save(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Save user operation timed out after 10 seconds')), 10000),
      ),
    ]);
    console.log('After newUser.save(). Step 5 Complete: New user saved.');

    console.log('Step 6: Creating new player object...');
    const newPlayer = new Player({
      user: newUser._id,
      coach,
      name,
      dorsal,
      position,
      team, // Este es el nombre del equipo (String), que viene del autocompletado
    });
    console.log('Step 6 Complete: Player object created.');

    console.log('Step 7: Saving new player...');
    await newPlayer.save();
    console.log('Step 7 Complete: New player saved.');

    console.log('--- PLAYER CREATION REQUEST SUCCESS ---');
    return NextResponse.json(
      { success: true, data: newPlayer },
      { status: 201 },
    );
  } catch (error) {
    console.error('--- PLAYER CREATION REQUEST FAILED ---', error);
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
          message: 'Error en el servidor al crear el jugador.',
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
