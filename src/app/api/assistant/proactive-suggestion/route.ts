// src/app/api/assistant/proactive-suggestion/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Player from '@/lib/models/Player';
import PlayerGameStats from '@/lib/models/PlayerGameStats';
import GameEvent from '@/lib/models/GameEvent';
import {
  generatePlayerProfiles,
  getProactiveSuggestion,
} from '@/lib/recommender/lineupRecommender';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const {
      allPlayerIds,
      onCourtPlayerIds,
      sessionId,
    }: { allPlayerIds: string[]; onCourtPlayerIds: string[], sessionId: string } = await request.json();

    if (!allPlayerIds || !onCourtPlayerIds || !sessionId || onCourtPlayerIds.length !== 5) {
      return NextResponse.json(
        { success: false, message: 'Datos incompletos para la sugerencia.' },
        { status: 400 },
      );
    }

    // 1. Obtener perfiles de todos los jugadores
    const allPlayers = await Player.find({ _id: { $in: allPlayerIds } }).select('name');
    const allObjectIds = allPlayerIds.map(id => new mongoose.Types.ObjectId(id));
    const careerAverages = await PlayerGameStats.aggregate([
      { $match: { player: { $in: allObjectIds } } },
      { $group: {
          _id: '$player',
          avgPoints: { $avg: '$points' },
          avgAst: { $avg: '$ast' },
          avgOrb: { $avg: '$orb' },
          avgDrb: { $avg: '$drb' },
          avgStl: { $avg: '$stl' },
          avgTov: { $avg: '$tov' },
          avg3pa: { $avg: '$3pa' },
          avg3pm: { $avg: '$3pm' },
        },
      },
    ]);
    const playersWithStats = allPlayers.map((player) => {
      const pStats = careerAverages.find((stat) => stat._id.equals(player._id));
      return { _id: player._id.toString(), name: player.name, careerAverages: pStats || null };
    });
    const allProfiles = generatePlayerProfiles(playersWithStats);

    // 2. Obtener todos los eventos del partido
    const gameEvents = await GameEvent.find({ sessionId }).sort({ createdAt: -1 });

    // 3. Obtener la sugerencia proactiva
    const suggestion = getProactiveSuggestion(onCourtPlayerIds, allProfiles, gameEvents);

    if (!suggestion) {
        return NextResponse.json({ success: true, data: null, message: 'La IA no tiene sugerencias por el momento.' });
    }

    return NextResponse.json({ success: true, data: suggestion });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor', error: errorMessage },
      { status: 500 },
    );
  }
}
