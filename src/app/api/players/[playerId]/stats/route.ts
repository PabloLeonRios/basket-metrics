// src/app/api/players/[playerId]/stats/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlayerGameStats from '@/lib/models/PlayerGameStats';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const pathname = request.nextUrl.pathname;
    const parts = pathname.split('/');
    const playerId = parts[parts.length - 2]; // la URL es /api/players/[playerId]/stats

    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return NextResponse.json(
        { success: false, message: 'ID de jugador inválido' },
        { status: 400 },
      );
    }

    // 1. Obtener todas las estadísticas partido a partido
    const gameByGameStats = await PlayerGameStats.find({
      player: playerId,
    }).populate('session', 'name date');

    // 2. Usar el Pipeline de Agregación para calcular los promedios de carrera
    const careerAverages = await PlayerGameStats.aggregate([
      { $match: { player: new mongoose.Types.ObjectId(playerId) } },
      {
        $group: {
          _id: '$player',
          avgPoints: { $avg: '$points' },
          avgAst: { $avg: '$ast' },
          avgOrb: { $avg: '$orb' },
          avgDrb: { $avg: '$drb' },
          avgStl: { $avg: '$stl' },
          avgTov: { $avg: '$tov' },
          avgFga: { $avg: '$fga' },
          avgFgm: { $avg: '$fgm' },
          avg3pa: { $avg: '$3pa' },
          avg3pm: { $avg: '$3pm' },
          avgFta: { $avg: '$fta' },
          avgFtm: { $avg: '$ftm' },
          avgEFG: { $avg: '$eFG' },
          avgTS: { $avg: '$TS' },
          avgGameScore: { $avg: '$gameScore' },
          totalGames: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          careerAverages: careerAverages[0] || null,
          gameByGameStats: gameByGameStats,
        },
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
