// src/app/api/players/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Player from '@/lib/models/Player';
import User from '@/lib/models/User';
import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { verifyAuth } from '@/lib/auth';

// GET: Obtener todos los jugadores de un entrenador con paginación, búsqueda y filtro de estado
export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    // Admin check: Allow fetching all players
    const token = request.cookies.get('token')?.value;
    const { payload } = await verifyAuth(token);
    const isAdmin = payload?.role === 'admin';

    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search');
    const status = searchParams.get('status'); // 'inactive' or default to active

    if (!coachId && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Se requiere el ID del entrenador (coachId) para usuarios no administradores.',
        },
        { status: 400 },
      );
    }
    
    // Build the query object
    const query: any = {};
    if (coachId) {
      query.coach = coachId;
    }

    if (status === 'inactive') {
      // If status is 'inactive', we only want players where isActive is false.
      query.isActive = false;
    } else {
      // By default, show active players. This now includes players where `isActive` is true
      // AND players where the `isActive` field does not exist (for backward compatibility).
      query.isActive = { $ne: false };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
      if (!isNaN(Number(search))) {
        query.$or.push({ dorsal: Number(search) });
      }
    }

    const skip = (page - 1) * limit;

    const [players, totalCount] = await Promise.all([
      Player.find(query).skip(skip).limit(limit).sort({ name: 1 }),
      Player.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const serializedPlayers = JSON.parse(JSON.stringify(players));

    return NextResponse.json(
      {
        success: true,
        data: serializedPlayers,
        currentPage: page,
        totalPages,
        totalCount,
      },
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

// POST: Crear un nuevo jugador
export async function POST(request: NextRequest) {
  console.log('--- PLAYER CREATION REQUEST START ---');
  await dbConnect();
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
    const hashedPassword = await bcrypt.hash(placeholderPassword, 10);
    console.log('Step 2 Complete: Password hashed.');
    
    console.log('Step 3: Finding coach user...');
    const coachUser = await User.findById(coach).select('team');
    if (!coachUser) {
        console.error('Coach not found!');
        return NextResponse.json({ success: false, message: 'Entrenador no encontrado.' }, { status: 404 });
    }
    console.log('Step 3 Complete: Coach found.');

    console.log('Step 4: Creating placeholder user object...');
    const randomString = Math.random().toString(36).substring(2, 10);
    const placeholderEmail = `player.${randomString}.${Date.now()}@basketmetrics.local`;
    const newUser = new User({
      name,
      email: placeholderEmail,
      password: hashedPassword,
      role: 'jugador',
      isActive: true, // User is active by default
      team: coachUser.team, // Asignar el equipo del entrenador
    });
    console.log('Step 4 Complete: User object created.');

    console.log('Step 5: Saving new user (direct insert with driver)...');
    const newUserPlain: any = newUser.toObject();
    delete newUserPlain._id;
    delete newUserPlain.__v;
    const result = await User.collection.insertOne(newUserPlain);
    newUser._id = result.insertedId as any; // Assign the newly generated _id back to the Mongoose document for subsequent use
    console.log('Step 5 Complete: New user saved (direct insert). Inserted ID:', result.insertedId);

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
