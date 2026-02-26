// src/app/api/assistant/recommend/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Player from '@/lib/models/Player';
import PlayerGameStats from '@/lib/models/PlayerGameStats';
import {
  generatePlayerProfiles,
  recommendLineup,
  GameSituation,
} from '@/lib/recommender/lineupRecommender';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const {
      playerIds,
      situation,
    }: { playerIds: string[]; situation: GameSituation } = await request.json();

    if (!playerIds || playerIds.length < 5 || !situation) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Se requiere una lista de al menos 5 IDs de jugador y una situación.',
        },
        { status: 400 },
      );
    }

    // 1. Obtener los datos de los jugadores (nombre)
    const players = await Player.find({ _id: { $in: playerIds } }).select(
      'name',
    );
    if (players.length !== playerIds.length) {
      return NextResponse.json(
        { success: false, message: 'Algunos IDs de jugador no son válidos.' },
        { status: 400 },
      );
    }

    // 2. Calcular los promedios de carrera para los jugadores seleccionados
    const objectIds = playerIds.map((id) => new mongoose.Types.ObjectId(id));
    const careerAverages = await PlayerGameStats.aggregate([
      { $match: { player: { $in: objectIds } } },
      {
        $group: {
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

    // Unir los nombres de los jugadores con sus promedios
    const playersWithStats = players.map((player) => {
      const pStats = careerAverages.find((stat) => stat._id.equals(player._id));
      return {
        _id: player._id,
        name: player.name,
        careerAverages: pStats || null,
      };
    });

    // 3. Generar perfiles
    const allProfiles = generatePlayerProfiles(playersWithStats);

    // 4. Obtener recomendación
    const { lineup, reasoning } = recommendLineup(allProfiles, situation);

    // Devolvemos todos los perfiles para que la UI pueda mostrarlos,
    // la recomendación (quinteto) y la explicación.
    return NextResponse.json(
      { success: true, data: { lineup, reasoning, allProfiles } },
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
