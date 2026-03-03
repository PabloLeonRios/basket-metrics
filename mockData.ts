import mongoose from 'mongoose';
import dbConnect from './src/lib/dbConnect';
import Session from './src/lib/models/Session';
import Player from './src/lib/models/Player';

async function createMockData() {
  await dbConnect();

  // Crear 10 jugadores
  const playersA = [];
  const playersB = [];
  for (let i = 1; i <= 10; i++) {
    const p = await Player.create({
      user: new mongoose.Types.ObjectId().toString(),
      coach: '65b93d0f0000000000000001',
      name: `Player ${i}`,
      position: 'Base',
      dorsal: i,
      isActive: true,
    });
    if (i <= 5) playersA.push(p._id);
    else playersB.push(p._id);
  }

  // Crear sesión
  const s = await Session.create({
    coach: '65b93d0f0000000000000001',
    name: 'Test Session',
    date: new Date().toISOString(),
    sessionType: 'Partido',
    teams: [
      { name: 'Team A', players: playersA },
      { name: 'Team B', players: playersB },
    ],
  });

  console.log('SESSION_ID=' + s._id);
  process.exit(0);
}

createMockData();
