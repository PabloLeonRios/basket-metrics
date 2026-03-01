// src/app/api/stats/quarters/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import GameEvent from '@/lib/models/GameEvent';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Se requiere el ID de la sesión.' },
        { status: 400 },
      );
    }

    const sessionObjId = new mongoose.Types.ObjectId(sessionId);

    const stats = await GameEvent.aggregate([
      { $match: { session: sessionObjId } },
      {
        $group: {
          _id: { quarter: '$quarter', team: '$team' },
          points: {
            $sum: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$type', 'tiro'] },
                    then: {
                      $cond: [
                        { $eq: ['$details.made', true] },
                        '$details.value',
                        0,
                      ],
                    },
                  },
                  {
                    case: { $eq: ['$type', 'tiro_libre'] },
                    then: {
                      $cond: [{ $eq: ['$details.made', true] }, 1, 0],
                    },
                  },
                ],
                default: 0,
              },
            },
          },
          fga: {
            $sum: { $cond: [{ $eq: ['$type', 'tiro'] }, 1, 0] },
          },
          fgm: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$type', 'tiro'] },
                    { $eq: ['$details.made', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          '3pa': {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$type', 'tiro'] },
                    { $eq: ['$details.value', 3] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          '3pm': {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$type', 'tiro'] },
                    { $eq: ['$details.value', 3] },
                    { $eq: ['$details.made', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          fta: {
            $sum: { $cond: [{ $eq: ['$type', 'tiro_libre'] }, 1, 0] },
          },
          ftm: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$type', 'tiro_libre'] },
                    { $eq: ['$details.made', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          tov: {
            $sum: { $cond: [{ $eq: ['$type', 'perdida'] }, 1, 0] },
          },
          reb: {
            $sum: { $cond: [{ $eq: ['$type', 'rebote'] }, 1, 0] },
          },
          ast: {
            $sum: { $cond: [{ $eq: ['$type', 'asistencia'] }, 1, 0] },
          },
          stl: {
            $sum: { $cond: [{ $eq: ['$type', 'robo'] }, 1, 0] },
          },
          blk: {
            $sum: { $cond: [{ $eq: ['$type', 'tapon'] }, 1, 0] },
          },
          pf: {
            $sum: { $cond: [{ $eq: ['$type', 'falta'] }, 1, 0] },
          },
        },
      },
      {
        $group: {
          _id: '$_id.quarter',
          teams: {
            $push: {
              team: '$_id.team',
              points: '$points',
              fga: '$fga',
              fgm: '$fgm',
              '3pa': '$3pa',
              '3pm': '$3pm',
              fta: '$fta',
              ftm: '$ftm',
              tov: '$tov',
              reb: '$reb',
              ast: '$ast',
              stl: '$stl',
              blk: '$blk',
              pf: '$pf',
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          quarter: '$_id',
          teams: 1,
        },
      },
    ]);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor', error: errorMessage },
      { status: 500 },
    );
  }
}
