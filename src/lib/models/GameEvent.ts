// src/lib/models/GameEvent.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { IGameEvent } from '@/types/definitions';

type GameEventDocument = IGameEvent & Document;

const GameEventSchema: Schema = new Schema(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    player: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    team: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'tiro',
        'perdida',
        'rebote',
        'asistencia',
        'robo',
        'falta',
        'tapón',
      ],
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

const GameEvent: Model<GameEventDocument> =
  models.GameEvent ||
  mongoose.model<GameEventDocument>('GameEvent', GameEventSchema);

export default GameEvent;
