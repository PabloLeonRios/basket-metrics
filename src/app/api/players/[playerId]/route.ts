// src/app/api/players/[playerId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Player from '@/lib/models/Player';
import User from '@/lib/models/User';
import GameEvent from '@/lib/models/GameEvent';

// GET: Obtener un jugador específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  await dbConnect();
  try {
    const player = await Player.findById(playerId).populate('user', 'email isActive');
    if (!player) {
      return NextResponse.json(
        { success: false, message: 'Jugador no encontrado' },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: player });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor', error: errorMessage },
      { status: 500 },
    );
  }
}

// PUT: Actualizar un jugador
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  await dbConnect();
  try {
    const body = await request.json();
    const { name, dorsal, position, isActive, team, isRival } = body;

    const updateData: Record<string, unknown> = { name, dorsal, position, isActive, team };
    if (isRival !== undefined) {
      updateData.isRival = isRival;
    }

    const updatedPlayer = await Player.findByIdAndUpdate(
      playerId,
      updateData,
      { returnDocument: 'after', runValidators: true },
    );

    if (!updatedPlayer) {
      return NextResponse.json(
        { success: false, message: 'Jugador no encontrado' },
        { status: 404 },
      );
    }
    
    // Also update the associated User's name if it has changed
    if (name) {
        await User.findByIdAndUpdate(updatedPlayer.user, { name });
    }

    return NextResponse.json({ success: true, data: updatedPlayer });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error al actualizar el jugador', error: errorMessage },
      { status: 500 },
    );
  }
}

// DELETE: Eliminar un jugador
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  await dbConnect();
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      return NextResponse.json(
        { success: false, message: 'Jugador no encontrado' },
        { status: 404 },
      );
    }

    // Delete associated game events
    await GameEvent.deleteMany({ player: playerId });

    // Delete associated user
    await User.findByIdAndDelete(player.user);

    // Delete the player
    await Player.findByIdAndDelete(playerId);

    return NextResponse.json({ success: true, message: 'Jugador eliminado correctamente' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error al eliminar el jugador', error: errorMessage },
      { status: 500 },
    );
  }
}
