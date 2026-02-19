// src/lib/models/Player.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { IPlayer } from '@/types/definitions';

type PlayerDocument = IPlayer & Document;

const PlayerSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    coach: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    position: {
      type: String,
    },
    dorsal: {
      type: Number,
    },
    team: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Player: Model<PlayerDocument> =
  models.Player || mongoose.model<PlayerDocument>('Player', PlayerSchema);

export default Player;
