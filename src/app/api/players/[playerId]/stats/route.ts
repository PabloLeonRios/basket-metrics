// src/app/api/players/[playerId]/stats/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlayerGameStats from '@/lib/models/PlayerGameStats';
import Player from '@/lib/models/Player';
import Session from '@/lib/models/Session';
import mongoose from 'mongoose';
import { calculateStatsForSession } from '@/lib/engine/statsCalculator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> },
) {
  await dbConnect();
  try {
    const { playerId } = await params;

    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return NextResponse.json(
        { success: false, message: 'ID de jugador inválido' },
        { status: 400 },
      );
    }

    // --- CÁLCULO JUST-IN-TIME ---
    // 1. Encontrar todas las sesiones en las que participó el jugador.
    const playerSessions = await Session.find({ "teams.players": playerId }).select('_id');
    const playerSessionIds = playerSessions.map(s => s._id);

    // 2. Encontrar todas las stats ya calculadas para este jugador.
    const existingStats = await PlayerGameStats.find({ player: playerId }).select('session');
    const calculatedSessionIds = new Set(existingStats.map(stat => stat.session.toString()));

    // 3. Determinar qué sesiones necesitan ser calculadas.
    const sessionsToCalculate = playerSessionIds.filter(id => !calculatedSessionIds.has(id.toString()));

    // 4. Calcular las stats para las sesiones pendientes.
    if (sessionsToCalculate.length > 0) {
      console.log(`Calculando stats para ${sessionsToCalculate.length} sesiones pendientes para el jugador ${playerId}...`);
      for (const sessionId of sessionsToCalculate) {
        // Envolvemos en try/catch para que un error en una sesión no detenga todo
        try {
          await calculateStatsForSession(sessionId.toString());
        } catch (calcError) {
          console.error(`Error calculando stats para la sesión ${sessionId}:`, calcError);
        }
      }
      console.log('Cálculo de sesiones pendientes finalizado.');
    }
    // --- FIN CÁLCULO JUST-IN-TIME ---


    // 1. Obtener todas las estadísticas partido a partido del jugador
    const gameByGameStats = await PlayerGameStats.find({
      player: playerId,
    }).populate('session', 'name date finishedAt');

    // 2. Usar el Pipeline de Agregación para calcular los promedios de carrera del jugador
    const playerCareerAveragesArr = await PlayerGameStats.aggregate([
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
    const playerCareerAverages = playerCareerAveragesArr[0] || null;

    // --- CÁLCULO DEL VALOR GLOBAL ---
    let globalValue = null;

    if (playerCareerAverages) {
      // 3. Encontrar al jugador para obtener su equipo
      const player = await Player.findById(playerId).select('team isRival');
      if (player && player.team && !player.isRival) {
        // 4. Encontrar a todos los jugadores del mismo equipo
        const teamPlayers = await Player.find({ team: player.team, isRival: { $ne: true } }).select('_id');
        const teamPlayerIds = teamPlayers.map(p => p._id);

        // 5. Calcular el GameScore promedio para todo el equipo
        const teamAverages = await PlayerGameStats.aggregate([
          { $match: { player: { $in: teamPlayerIds } } },
          {
            $group: {
              _id: null,
              teamAvgGameScore: { $avg: '$gameScore' },
            },
          },
        ]);

        if (teamAverages.length > 0 && teamAverages[0].teamAvgGameScore > 0) {
          const teamAvgGameScore = teamAverages[0].teamAvgGameScore;
          const playerAvgGameScore = playerCareerAverages.avgGameScore;
          
          // Fórmula de normalización: 50 es la media. Un jugador promedio tendrá 50.
          // El valor se escala para que esté en un rango visible.
          let calculatedValue = (playerAvgGameScore / teamAvgGameScore) * 50;
          
          // Limitar el valor entre 1 y 99 para mantenerlo en un rango razonable.
          calculatedValue = Math.max(1, Math.min(calculatedValue, 99));
          globalValue = Math.round(calculatedValue);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          careerAverages: playerCareerAverages,
          gameByGameStats: gameByGameStats,
          globalValue: globalValue, // Devolver el valor global
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
