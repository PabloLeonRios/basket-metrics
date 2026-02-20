// src/app/api/players/route.ts
import mongoose from 'mongoose';
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Player from '@/lib/models/Player';
import User from '@/lib/models/User';
import Team from '@/lib/models/Team'; // Ensure Team model is registered
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
  await dbConnect();
  
  try {
    const body = await request.json();
    const { name, dorsal, position, team, coach } = body;
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
    const hashedPassword = await bcrypt.hash(placeholderPassword, 10);
    console.log('Step 2 Complete: Password hashed.');
    
    console.log('Step 3: Finding coach user...');
    const coachUser = await User.findById(coach).select('team').lean();
    if (!coachUser) {
        console.error('Coach not found!');
        return NextResponse.json({ success: false, message: 'Entrenador no encontrado.' }, { status: 404 });
    }
    console.log('Step 3 Complete: Coach found. Team ID:', coachUser.team);

    console.log('Step 4: Preparing data...');
    const randomString = Math.random().toString(36).substring(2, 10);
    const placeholderEmail = `player.${randomString}.${Date.now()}@basketmetrics.local`;
    
    const userData = {
      name,
      email: placeholderEmail,
      password: hashedPassword,
      role: 'jugador',
      isActive: false,
      team: coachUser.team ? coachUser.team.toString() : undefined,
    };
    console.log('Step 4 Complete: Data prepared.');

    console.log('Step 5: Saving new user... Mongoose State:', mongoose.connection.readyState);
    // Use create instead of new + save
    const newUser = await User.create(userData);
    console.log('Step 5 Complete: New user created with ID:', newUser._id);

    console.log('Step 6: Creating new player object...');
    const newPlayer = await Player.create({
      user: newUser._id,
      coach,
      name,
      dorsal: dorsal ? Number(dorsal) : undefined,
      position,
      team, // Team name string
    });
    console.log('Step 6 Complete: Player object created with ID:', newPlayer._id);

    console.log('--- PLAYER CREATION REQUEST SUCCESS ---');
    return NextResponse.json(
      { success: true, data: newPlayer },
      { status: 201 },
    );
  } catch (error) {
    console.error('--- PLAYER CREATION REQUEST FAILED ---');
    console.error(error);
    
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
