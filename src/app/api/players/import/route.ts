import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Player from '@/lib/models/Player';
import User from '@/lib/models/User';
import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const token = request.cookies.get('token')?.value;
    const { payload } = await verifyAuth(token);

    if (!payload || !payload._id) {
        return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { players } = body;

    if (!players || !Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No se encontraron jugadores para importar.' },
        { status: 400 }
      );
    }

    if (players.length > 30) {
      return NextResponse.json(
        { success: false, message: 'Solo se pueden importar hasta 30 jugadores a la vez.' },
        { status: 400 }
      );
    }

    const coachId = payload._id;
    const coachUser = await User.findById(coachId).select('team');

    if (!coachUser) {
        return NextResponse.json({ success: false, message: 'Entrenador no encontrado.' }, { status: 404 });
    }

    const createdPlayers = [];
    const errors = [];

    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        try {
            if (!p.name) {
                throw new Error(`Falta el nombre del jugador en la posición ${i + 1}`);
            }

            // Create placeholder user with isActive: false
            const placeholderPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(placeholderPassword, 10);

            const randomString = Math.random().toString(36).substring(2, 10);
            const placeholderEmail = `player.${randomString}.${Date.now()}@basketmetrics.local`;

            const newUser = new User({
                name: p.name,
                email: placeholderEmail,
                password: hashedPassword,
                role: 'jugador',
                isActive: false, // Imported players are inactive by default
                team: coachUser.team,
            });

            const newUserPlain: Record<string, unknown> = newUser.toObject() as unknown as Record<string, unknown>;
            delete newUserPlain._id;
            delete newUserPlain.__v;

            const result = await User.collection.insertOne(newUserPlain);
            newUser._id = result.insertedId as unknown as typeof newUser._id;

            // Create player with isActive: false
            const newPlayer = new Player({
                user: newUser._id,
                coach: coachId,
                name: p.name,
                dorsal: p.dorsal,
                position: p.position,
                team: p.team,
                isRival: !!p.isRival,
                isActive: false, // Imported players are inactive by default
            });

            await newPlayer.save();
            createdPlayers.push(newPlayer);
        } catch (error) {
            errors.push({
                index: i,
                player: p.name,
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    if (createdPlayers.length === 0) {
         return NextResponse.json(
            { success: false, message: 'No se pudo importar ningún jugador.', errors },
            { status: 400 }
         );
    }

    return NextResponse.json(
      {
          success: true,
          message: `Se importaron ${createdPlayers.length} jugadores exitosamente.`,
          data: createdPlayers,
          errors: errors.length > 0 ? errors : undefined
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor al importar', error: errorMessage },
      { status: 500 }
    );
  }
}
