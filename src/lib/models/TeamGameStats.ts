// src/lib/models/TeamGameStats.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { ITeamGameStats } from '@/types/definitions';

type TeamGameStatsDocument = ITeamGameStats & Document;

const TeamGameStatsSchema: Schema = new Schema(
  {
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    teamName: { type: String, required: true },
    points: { type: Number, required: true },
    possessions: { type: Number, required: true },
    ortg: { type: Number, required: true },
    drtg: { type: Number, required: true },
  },
  {
    timestamps: true,
    // Creamos un índice compuesto para asegurar que solo haya un doc de stats
    // por equipo y por sesión.
    unique: true,
    index: { session: 1, teamName: 1 },
  },
);

const TeamGameStats: Model<TeamGameStatsDocument> =
  models.TeamGameStats ||
  mongoose.model<TeamGameStatsDocument>('TeamGameStats', TeamGameStatsSchema);

export default TeamGameStats;
