// src/lib/models/PlayerGameStats.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { IPlayerGameStats } from '@/types/definitions';

type PlayerGameStatsDocument = IPlayerGameStats & Document;

const PlayerGameStatsSchema: Schema = new Schema(
  {
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },

    // Stats Básicas
    points: { type: Number, default: 0 },
    fga: { type: Number, default: 0 },
    fgm: { type: Number, default: 0 },
    '3pa': { type: Number, default: 0 },
    '3pm': { type: Number, default: 0 },
    fta: { type: Number, default: 0 },
    ftm: { type: Number, default: 0 },
    orb: { type: Number, default: 0 },
    drb: { type: Number, default: 0 },
    ast: { type: Number, default: 0 },
    stl: { type: Number, default: 0 },
    tov: { type: Number, default: 0 },
    blk: { type: Number, default: 0 },
    pf: { type: Number, default: 0 },

    // Stats Avanzadas
    eFG: { type: Number, default: 0 },
    TS: { type: Number, default: 0 },
    gameScore: { type: Number, default: 0 },

    // Placeholders
    minutesPlayed: { type: Number, default: 0 },
    USG: { type: Number, default: 0 },
    ORB_rate: { type: Number, default: 0 },
    DRB_rate: { type: Number, default: 0 },
    AST_rate: { type: Number, default: 0 },
    TO_rate: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

// Índice para asegurar que solo haya un doc de stats por jugador y por sesión
PlayerGameStatsSchema.index({ session: 1, player: 1 }, { unique: true });

const PlayerGameStats: Model<PlayerGameStatsDocument> =
  models.PlayerGameStats ||
  mongoose.model<PlayerGameStatsDocument>(
    'PlayerGameStats',
    PlayerGameStatsSchema,
  );

export default PlayerGameStats;
