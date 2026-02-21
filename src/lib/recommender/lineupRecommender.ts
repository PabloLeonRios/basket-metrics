// src/lib/recommender/lineupRecommender.ts

// --- TIPOS Y DEFINICIONES ---

// Perfiles que podemos asignar a un jugador
export type PlayerProfileTag =
  | 'ANOTADOR'
  | 'TIRADOR_3P'
  | 'REBOTEADOR_OFE'
  | 'REBOTEADOR_DEF'
  | 'ORGANIZADOR'
  | 'DEFENSOR';

// Objeto que representa el perfil de un jugador
export interface PlayerProfile {
  playerId: string;
  name: string;
  tags: Set<PlayerProfileTag>;
  careerAverages: CareerAverages | null; // Añadir estadísticas de carrera
}

// Situaciones de partido que el entrenador puede elegir
export type GameSituation =
  | 'NEEDS_SCORING'
  | 'NEEDS_3P'
  | 'NEEDS_DEFENSE'
  | 'BALANCED';

// Interfaz para el objeto de jugador con sus promedios
export interface CareerAverages {
  avgPoints: number;
  avgAst: number;
  avgOrb: number;
  avgDrb: number;
  avgStl: number;
  avgTov: number;
  avg3pa: number;
  avg3pm: number;
  // ... y cualquier otro promedio que se agregue
}

interface PlayerWithStats {
  _id: string;
  name: string;
  careerAverages: CareerAverages | null;
}

// --- LÓGICA DE PERFILADO ---

/**
 * Genera perfiles para una lista de jugadores basándose en sus estadísticas de carrera.
 * @param playersWithStats Array de jugadores con sus estadísticas promedio.
 * @returns Un array de perfiles de jugador.
 */
export function generatePlayerProfiles(
  playersWithStats: PlayerWithStats[],
): PlayerProfile[] {
  return playersWithStats.map((p) => {
    const stats = p.careerAverages;
    const tags = new Set<PlayerProfileTag>();

    if (!stats) {
      return { playerId: p._id, name: p.name, tags, careerAverages: null };
    }

    // Lógica de perfilado basada en umbrales (estos valores son ejemplos y se pueden ajustar)
    if (stats.avgPoints > 12) tags.add('ANOTADOR');

    const threePointPercentage =
      stats.avg3pa > 1 ? stats.avg3pm / stats.avg3pa : 0;
    if (threePointPercentage > 0.35 && stats.avg3pa > 2) tags.add('TIRADOR_3P');

    if (stats.avgOrb > 2) tags.add('REBOTEADOR_OFE');
    if (stats.avgDrb > 4) tags.add('REBOTEADOR_DEF');

    if (stats.avgAst > 3) tags.add('ORGANIZADOR');

    if (stats.avgStl > 1) tags.add('DEFENSOR');

    return {
      playerId: p._id,
      name: p.name, // Asumimos que el nombre del jugador está en el objeto
      tags,
      careerAverages: p.careerAverages, // Pasar las estadísticas completas
    };
  });
}

// --- LÓGICA DE RECOMENDACIÓN (Placeholder) ---

/**
 * Recomienda un quinteto de 5 jugadores basado en una situación de partido.
 * Utiliza un sistema de puntuación para encontrar la mejor combinación.
 * @param playerProfiles Perfiles de todos los jugadores disponibles.
 * @param situation La situación actual del partido.
 * @returns Un array de 5 perfiles de jugador recomendados.
 */
export function recommendLineup(
  playerProfiles: PlayerProfile[],
  situation: GameSituation,
): PlayerProfile[] {
  // 1. Definir "recetas" de puntuación para cada situación
  const scoreMap: Record<
    GameSituation,
    Partial<Record<PlayerProfileTag, number>>
  > = {
    NEEDS_SCORING: {
      ANOTADOR: 3,
      TIRADOR_3P: 2,
      ORGANIZADOR: 1,
    },
    NEEDS_3P: {
      TIRADOR_3P: 4,
      ANOTADOR: 2,
      ORGANIZADOR: 1,
    },
    NEEDS_DEFENSE: {
      DEFENSOR: 3,
      REBOTEADOR_DEF: 2,
      REBOTEADOR_OFE: 1, // También ayuda en defensa al evitar segundas oportunidades
    },
    BALANCED: {
      ANOTADOR: 1,
      TIRADOR_3P: 1,
      ORGANIZADOR: 1,
      DEFENSOR: 1,
      REBOTEADOR_DEF: 1,
      REBOTEADOR_OFE: 1,
    },
  };

  // 2. Calcular el "match score" para cada jugador
  const situationScores = scoreMap[situation];
  const scoredPlayers = playerProfiles.map((profile) => {
    let matchScore = 0;
    for (const tag of profile.tags) {
      if (situationScores[tag]) {
        matchScore += situationScores[tag]!;
      }
    }
    return { ...profile, score: matchScore };
  });

  // 3. Ordenar jugadores por puntuación y devolver los 5 mejores
  const sortedPlayers = scoredPlayers.sort((a, b) => b.score - a.score);

  return sortedPlayers.slice(0, 5);
}
