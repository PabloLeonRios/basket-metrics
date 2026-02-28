// src/lib/recommender/lineupRecommender.ts
import { IGameEvent } from '@/types/definitions';

// --- TIPOS Y DEFINICIONES ---
export type PlayerProfileTag =
  | 'ANOTADOR'
  | 'TIRADOR_3P'
  | 'REBOTEADOR_OFE'
  | 'REBOTEADOR_DEF'
  | 'ORGANIZADOR'
  | 'DEFENSOR';

export interface PlayerProfile {
  playerId: string;
  name: string;
  tags: Set<PlayerProfileTag>;
  careerAverages: CareerAverages | null;
}

export interface PlayerProfileWithScore extends PlayerProfile {
  suitabilityScore: number;
}

export interface XFactorResult {
  player: PlayerProfile;
  reasoning: string;
}

export interface StrategicOption {
    title: string;
    lineup: PlayerProfileWithScore[];
    reasoning: string;
    xFactor: XFactorResult | null;
}

// Interfaz para la nueva sugerencia proactiva
export interface ProactiveSuggestion {
    playerOut: PlayerProfile;
    playerIn: PlayerProfile;
    reason: string;
}

export type GameSituation =
  | 'NEEDS_SCORING'
  | 'NEEDS_3P'
  | 'NEEDS_DEFENSE'
  | 'BALANCED';

export interface CareerAverages {
  avgPoints: number;
  avgAst: number;
  avgOrb: number;
  avgDrb: number;
  avgStl: number;
  avgTov: number;
  avg3pa: number;
  avg3pm: number;
}

interface PlayerWithStats {
  _id: string;
  name: string;
  careerAverages: CareerAverages | null;
}

// --- LÓGICA DE PERFILADO ---
export function generatePlayerProfiles(
  playersWithStats: PlayerWithStats[],
): PlayerProfile[] {
  return playersWithStats.map((p) => {
    const stats = p.careerAverages;
    const tags = new Set<PlayerProfileTag>();
    if (!stats) {
      return { playerId: p._id, name: p.name, tags, careerAverages: null };
    }
    if (stats.avgPoints > 12) tags.add('ANOTADOR');
    const threePointPercentage = stats.avg3pa > 1 ? stats.avg3pm / stats.avg3pa : 0;
    if (threePointPercentage > 0.35 && stats.avg3pa > 2) tags.add('TIRADOR_3P');
    if (stats.avgOrb > 2) tags.add('REBOTEADOR_OFE');
    if (stats.avgDrb > 4) tags.add('REBOTEADOR_DEF');
    if (stats.avgAst > 3) tags.add('ORGANIZADOR');
    if (stats.avgStl > 1) tags.add('DEFENSOR');
    return { playerId: p._id, name: p.name, tags, careerAverages: p.careerAverages };
  });
}

// --- LÓGICA DE RECOMENDACIÓN ---

const situationPrimaryTag: Record<GameSituation, PlayerProfileTag> = {
  NEEDS_SCORING: 'ANOTADOR',
  NEEDS_3P: 'TIRADOR_3P',
  NEEDS_DEFENSE: 'DEFENSOR',
  BALANCED: 'ANOTADOR',
};

function findXFactor(lineup: PlayerProfile[], situation: GameSituation): XFactorResult | null {
    // ... (la función findXFactor se mantiene igual)
    const primaryTag = situationPrimaryTag[situation];
    let xFactorCandidate: PlayerProfile | null = null;
    let maxStat = -1;

    for (const player of lineup) {
        if (player.tags.has(primaryTag)) {
            const stats = player.careerAverages;
            if (!stats) continue;
            let currentStat = 0;
            switch (primaryTag) {
                case 'ANOTADOR': currentStat = stats.avgPoints; break;
                case 'TIRADOR_3P': currentStat = stats.avg3pm; break;
                case 'DEFENSOR': currentStat = stats.avgStl + stats.avgDrb; break;
                default: currentStat = stats.avgPoints;
            }
            if (currentStat > maxStat) {
                maxStat = currentStat;
                xFactorCandidate = player;
            }
        }
    }
    if (!xFactorCandidate) return null;

    const reasoningTemplates: Record<PlayerProfileTag, string> = {
        ANOTADOR: `es tu principal amenaza ofensiva con un promedio de ${maxStat.toFixed(1)} puntos. Su capacidad para anotar puede desequilibrar la defensa rival. Sugerencia: Búscalo en las primeras jugadas.`,
        TIRADOR_3P: `es tu tirador más fiable. Generar espacios para él puede ser la clave.`,
        DEFENSOR: `es tu ancla defensiva. Su combinación de robos y rebotes lo hace fundamental para detener el ataque rival. Sugerencia: Asígnale la marca del jugador más peligroso del oponente.`,
        ORGANIZADOR: 'No implementado',
        REBOTEADOR_DEF: 'No implementado',
        REBOTEADOR_OFE: 'No implementado',
    };

    if (primaryTag === 'TIRADOR_3P' && xFactorCandidate.careerAverages) {
        const avg3p = xFactorCandidate.careerAverages.avg3pa > 0 ? (xFactorCandidate.careerAverages.avg3pm / xFactorCandidate.careerAverages.avg3pa) : 0;
        reasoningTemplates.TIRADOR_3P = `es tu tirador más fiable, con un acierto del ${(avg3p * 100).toFixed(0)}% en triples. Generar espacios para él puede ser la clave.`;
    }

    return {
        player: xFactorCandidate,
        reasoning: `Concéntrate en ${xFactorCandidate.name}. Según las estadísticas, ${reasoningTemplates[primaryTag]}`
    };
}


export function recommendLineups(
  playerProfiles: PlayerProfile[],
  situation: GameSituation,
): {
  recommendations: StrategicOption[];
  allProfiles: PlayerProfileWithScore[];
} {
  // ... (la función recommendLineups se mantiene igual)
  const scoreMap: Record<GameSituation, Partial<Record<PlayerProfileTag, number>>> = {
    NEEDS_SCORING: { ANOTADOR: 3, TIRADOR_3P: 2, ORGANIZADOR: 1 },
    NEEDS_3P: { TIRADOR_3P: 4, ANOTADOR: 2, ORGANIZADOR: 1 },
    NEEDS_DEFENSE: { DEFENSOR: 3, REBOTEADOR_DEF: 2, REBOTEADOR_OFE: 1 },
    BALANCED: { ANOTADOR: 1, TIRADOR_3P: 1, ORGANIZADOR: 1, DEFENSOR: 1, REBOTEADOR_DEF: 1, REBOTEADOR_OFE: 1 },
  };

  const situationScores = scoreMap[situation];
  const allProfilesWithScores = playerProfiles.map((profile) => {
    let score = 0;
    for (const tag of profile.tags) {
      if (situationScores[tag]) {
        score += situationScores[tag]!;
      }
    }
    score += (profile.careerAverages?.avgPoints || 0) * 0.1;
    const maxPossibleScore = Object.values(situationScores).reduce((sum, val) => sum + val!, 0) + 2;
    const suitabilityScore = Math.min(((score / maxPossibleScore) * 10), 10);
    return { ...profile, suitabilityScore };
  }).sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  const specialistLineup = allProfilesWithScores.slice(0, 5);
  const specialistXFactor = findXFactor(specialistLineup, situation);
  const optionA: StrategicOption = {
      title: 'Opción 1: Quinteto de Especialistas',
      lineup: specialistLineup,
      reasoning: `Este es tu quinteto más potente para la situación de "${situation}". Maximiza los perfiles clave (${Object.keys(situationScores).join(', ')}) para un impacto inmediato.`,
      xFactor: specialistXFactor,
  };

  let balancedLineup: PlayerProfileWithScore[] = [];
  const remainingPlayers = allProfilesWithScores.filter(p => !specialistLineup.some(s => s.playerId === p.playerId));
  balancedLineup.push(...specialistLineup.slice(0, 3));
  const findBestByTag = (players: PlayerProfileWithScore[], tag: PlayerProfileTag) => players.filter(p => p.tags.has(tag)).sort((a, b) => b.suitabilityScore - a.suitabilityScore)[0];
  const bestDefender = findBestByTag(remainingPlayers.filter(p => !balancedLineup.some(b => b.playerId === p.playerId)), 'DEFENSOR');
  if (bestDefender) balancedLineup.push(bestDefender);
  const bestOrganizer = findBestByTag(remainingPlayers.filter(p => !balancedLineup.some(b => b.playerId === p.playerId)), 'ORGANIZADOR');
  if (bestOrganizer) balancedLineup.push(bestOrganizer);
  let i = 0;
  while (balancedLineup.length < 5 && i < remainingPlayers.length) {
    const player = remainingPlayers[i];
    if (!balancedLineup.some(p => p.playerId === player.playerId)) balancedLineup.push(player);
    i++;
  }
  balancedLineup = balancedLineup.slice(0, 5).sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  const balancedXFactor = findXFactor(balancedLineup, situation);
  const optionB: StrategicOption = {
      title: 'Opción 2: Quinteto Equilibrado',
      lineup: balancedLineup,
      reasoning: 'Esta opción sacrifica un poco de especialización pura a cambio de mayor versatilidad, añadiendo perfiles de defensa y organización para un mejor control del juego.',
      xFactor: balancedXFactor,
  };
  
  const isLineupSame = JSON.stringify(optionA.lineup.map(p => p.playerId).sort()) === JSON.stringify(optionB.lineup.map(p => p.playerId).sort());

  return {
    recommendations: isLineupSame ? [optionA] : [optionA, optionB],
    allProfiles: allProfilesWithScores,
  };
}


/**
 * Analiza el estado del juego y sugiere proactivamente un cambio.
 */
export function getProactiveSuggestion(
    onCourtPlayerIds: string[],
    allPlayerProfiles: PlayerProfile[],
    gameEvents: IGameEvent[],
): ProactiveSuggestion | null {
    const onCourtProfiles = allPlayerProfiles.filter(p => onCourtPlayerIds.includes(p.playerId));
    const benchProfiles = allPlayerProfiles.filter(p => !onCourtPlayerIds.includes(p.playerId));

    // Criterio 1: Problemas de Faltas
    for (const player of onCourtProfiles) {
        const foulCount = gameEvents.filter(e => e.player === player.playerId && e.type === 'falta').length;
        if (foulCount >= 4) {
            const replacement = findBestReplacement(player, benchProfiles);
            if (replacement) {
                return {
                    playerOut: player,
                    playerIn: replacement,
                    reason: `está en problemas de faltas (${foulCount} acumuladas).`
                };
            }
        }
    }

    // Criterio 2: Racha de Tiros Fallados
    for (const player of onCourtProfiles) {
        const playerShots = gameEvents
            .filter(e => e.player === player.playerId && e.type === 'tiro')
            .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()); // Más recientes primero

        if (playerShots.length >= 3) {
            if (!playerShots[0].details.made && !playerShots[1].details.made && !playerShots[2].details.made) {
                const replacement = findBestReplacement(player, benchProfiles);
                if (replacement) {
                    return {
                        playerOut: player,
                        playerIn: replacement,
                        reason: 'ha fallado sus últimos 3 tiros. Un cambio podría refrescar el ataque.'
                    };
                }
            }
        }
    }

    return null; // No hay sugerencias por ahora
}

/**
 * Encuentra el mejor reemplazo para un jugador desde el banquillo.
 */
function findBestReplacement(playerOut: PlayerProfile, bench: PlayerProfile[]): PlayerProfile | null {
    // Intenta encontrar un reemplazo con al menos un tag en común
    const primaryTags = Array.from(playerOut.tags);
    let bestFit: PlayerProfile | null = null;
    let bestScore = -1;

    for (const benchPlayer of bench) {
        const commonTags = Array.from(benchPlayer.tags).filter(tag => primaryTags.includes(tag));
        const score = commonTags.length; // Puntuación simple basada en tags compartidos

        if (score > bestScore) {
            bestScore = score;
            bestFit = benchPlayer;
        }
    }

    // Si no hay nadie con tags en común, simplemente devuelve el primer jugador del banquillo
    if (!bestFit && bench.length > 0) {
        return bench[0];
    }
    
    return bestFit;
}
