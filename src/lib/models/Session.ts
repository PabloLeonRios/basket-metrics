// src/lib/models/Session.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { ISession, sessionTypes } from '@/types/definitions';

type SessionDocument = ISession & Document;

const SessionSchema: Schema = new Schema(
  {
    coach: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    sessionType: {
      type: String,
      enum: sessionTypes,
      required: true,
    },
    teams: [
      {
        name: { type: String, required: true },
        players: [
          {
            type: Schema.Types.ObjectId,
            ref: 'Player',
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Session: Model<SessionDocument> =
  models.Session || mongoose.model<SessionDocument>('Session', SessionSchema);

export default Session;
