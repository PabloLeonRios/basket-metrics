
// src/lib/models/Team.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { ITeam } from '@/types/definitions';

type TeamDocument = ITeam & Document;

const TeamSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del equipo es obligatorio.'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Team: Model<TeamDocument> = models.Team || mongoose.model<TeamDocument>('Team', TeamSchema);

export default Team;
