// src/app/api/stats/top-players/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlayerGameStats from '@/lib/models/PlayerGameStats';
import Player from '@/lib/models/Player';
import { IPlayer } from '@/types/definitions';

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');

    if (!coachId) {
      return NextResponse.json(
        { success: false, message: 'Se requiere el ID del entrenador.' },
        { status: 400 },
      );
    }

    // Find all players for the given coach to ensure we only consider them
    const coachPlayers = await Player.find({ coach: coachId, isRival: { $ne: true } }).select('_id');
    const coachPlayerIds = coachPlayers.map(p => p._id);

    const topPlayers = await PlayerGameStats.aggregate([
      // Match only stats for players of the specified coach
      { $match: { player: { $in: coachPlayerIds } } },
      // Group by player to calculate average Game Score and total games
      {
        $group: {
          _id: '$player',
          avgGameScore: { $avg: '$gameScore' },
          totalGames: { $sum: 1 },
          avgPoints: { $avg: '$points' },
        },
      },
      // Sort by average Game Score in descending order
      { $sort: { avgGameScore: -1 } },
      // Limit to the top 3
      { $limit: 3 },
      // Lookup player details
      {
        $lookup: {
          from: 'players',
          localField: '_id',
          foreignField: '_id',
          as: 'playerDetails',
        },
      },
      // Deconstruct the playerDetails array
      { $unwind: '$playerDetails' },
      // Project the final fields
      {
        $project: {
          _id: 0,
          playerId: '$_id',
          name: '$playerDetails.name',
          dorsal: '$playerDetails.dorsal',
          avgGameScore: 1,
          totalGames: 1,
          avgPoints: 1,
        },
      },
    ]);

    return NextResponse.json({ success: true, data: topPlayers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor', error: errorMessage },
      { status: 500 },
    );
  }
}
