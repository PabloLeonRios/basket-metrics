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
    type: 'SUSTITUCION' | 'TACTICA' | 'POSITIVA';
    playerOut?: PlayerProfile;
    playerIn?: PlayerProfile;
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
    currentQuarter: number = 1
): ProactiveSuggestion | null {
    const onCourtProfiles = allPlayerProfiles.filter(p => onCourtPlayerIds.includes(p.playerId));

    // Asumimos que los jugadores en cancha pertenecen todos al mismo equipo (el equipo activo o de foco)
    const activeTeamName = gameEvents.find(e => e.player && onCourtPlayerIds.includes(e.player.toString()))?.team;

    // Filtrar el banquillo para que solo incluya jugadores del equipo activo (si se puede determinar)
    let benchProfiles = allPlayerProfiles.filter(p => !onCourtPlayerIds.includes(p.playerId));
    if (activeTeamName) {
        // Encontrar qué jugadores en allPlayerProfiles pertenecen al activeTeamName basado en gameEvents,
        // o si no han jugado, es más difícil. Mejor: asumimos que allPlayerProfiles vienen todos juntos,
        // pero en un tracker de 2 equipos, allPlayerProfiles incluye a TODOS.
        // Vamos a deducir el equipo de cada jugador por los eventos, o usar el equipo activo.
        const teamPlayersMap = new Map<string, string>();
        for (const ev of gameEvents) {
            if (ev.player && ev.team) teamPlayersMap.set(ev.player.toString(), ev.team);
        }
        benchProfiles = benchProfiles.filter(p => {
            const team = teamPlayersMap.get(p.playerId);
            // Si el jugador no tiene eventos, no podemos estar 100% seguros de su equipo por eventos.
            // Para ser seguros, si tiene equipo y es el activo, o si no tiene equipo lo dejamos pasar por ahora.
            return !team || team === activeTeamName;
        });
    }

    // Calcular el marcador actual
    let activeTeamScore = 0;
    let opposingTeamScore = 0;

    gameEvents.forEach((ev) => {
        if ((ev.type === 'tiro' || ev.type === 'tiro_libre') && ev.details.made) {
            const points = ev.details.value as number || 1;
            if (activeTeamName && ev.team === activeTeamName) {
                activeTeamScore += points;
            } else if (activeTeamName && ev.team !== activeTeamName) {
                opposingTeamScore += points;
            }
        }
    });

    const scoreDifference = activeTeamScore - opposingTeamScore;

    // --- Criterios de Contexto de Partido ---

    // 1. "Clutch Time": Último cuarto, partido ajustado (diferencia de 5 o menos)
    if (currentQuarter >= 4 && Math.abs(scoreDifference) <= 5 && benchProfiles.length > 0) {
        if (scoreDifference > 0) {
            // Vamos ganando: priorizar defensa y rebote
            const bestDefender = benchProfiles.find(p => p.tags.has('DEFENSOR') || p.tags.has('REBOTEADOR_DEF'));
            if (bestDefender) {
                // Sacar al peor defensor en cancha
                const weakestDefender = [...onCourtProfiles].sort((a, b) => {
                    const aDef = (a.careerAverages?.avgStl || 0) + (a.careerAverages?.avgDrb || 0);
                    const bDef = (b.careerAverages?.avgStl || 0) + (b.careerAverages?.avgDrb || 0);
                    return aDef - bDef;
                })[0];
                if (weakestDefender && weakestDefender.playerId !== bestDefender.playerId) {
                    return {
                        playerOut: weakestDefender,
                        playerIn: bestDefender,
                        reason: `el partido está ajustado (${activeTeamScore}-${opposingTeamScore}) y vas ganando. Asegura la defensa y el rebote en los momentos finales.`
                    };
                }
            }
        } else {
            // Vamos perdiendo: priorizar tiro exterior o anotación rápida
            const bestShooter = benchProfiles.find(p => p.tags.has('TIRADOR_3P') || p.tags.has('ANOTADOR'));
            if (bestShooter) {
                // Sacar al que menos aporta ofensivamente
                const weakestScorer = [...onCourtProfiles].sort((a, b) => {
                    const aPts = a.careerAverages?.avgPoints || 0;
                    const bPts = b.careerAverages?.avgPoints || 0;
                    return aPts - bPts;
                })[0];
                if (weakestScorer && weakestScorer.playerId !== bestShooter.playerId) {
                    return {
                        playerOut: weakestScorer,
                        playerIn: bestShooter,
                        reason: `el partido está ajustado (${activeTeamScore}-${opposingTeamScore}) y necesitas anotar. Busca amenaza exterior o puntos rápidos.`
                    };
                }
            }
        }
    }

    // 2. "Garbage Time": Último cuarto, diferencia de más de 15 puntos
    if (currentQuarter >= 4 && Math.abs(scoreDifference) >= 15 && benchProfiles.length > 0) {
        // Sacar al mejor jugador para darle descanso
        const bestPlayerOnCourt = [...onCourtProfiles].sort((a, b) => {
            const aPts = a.careerAverages?.avgPoints || 0;
            const bPts = b.careerAverages?.avgPoints || 0;
            return bPts - aPts; // Orden descendente
        })[0];

        // Meter al jugador con menos minutos/estadísticas o simplemente uno del banquillo
        const benchReplacement = benchProfiles[benchProfiles.length - 1]; // O el que sea

        if (bestPlayerOnCourt && benchReplacement) {
             return {
                 playerOut: bestPlayerOnCourt,
                 playerIn: benchReplacement,
                 reason: `el partido parece resuelto (diferencia de ${Math.abs(scoreDifference)} puntos). Es buen momento para dar descanso a tus titulares y evitar lesiones.`
             };
        }
    }

    // 3. Freno de Rachas (Momentum)
    // Miramos los últimos 10 eventos de tiro/tiro libre para ver si hay una racha rival
    if (activeTeamName && currentQuarter < 4) {
        const recentScoringEvents = gameEvents
            .filter(e => (e.type === 'tiro' || e.type === 'tiro_libre') && e.details.made)
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 5); // Últimos 5 tiros anotados

        // Si los últimos 3 o 4 tiros anotados son TODOS del equipo rival
        let opposingRun = 0;
        for (const ev of recentScoringEvents) {
            if (ev.team !== activeTeamName) opposingRun += (ev.details.value as number) || 1;
            else break; // Racha rota
        }

        if (opposingRun >= 8) {
             const organizerOrDefender = benchProfiles.find(p => p.tags.has('ORGANIZADOR') || p.tags.has('DEFENSOR'));
             if (organizerOrDefender) {
                 const playerOut = onCourtProfiles[0]; // Arbitrario o el de peor rendimiento reciente
                 return {
                     playerOut: playerOut,
                     playerIn: organizerOrDefender,
                     reason: `el equipo rival tiene una racha de ${opposingRun}-0. Un cambio puede ayudar a frenar su ritmo y organizar el ataque.`
                 };
             }
        }
    }

    // Criterio 1: Problemas de Faltas
    for (const player of onCourtProfiles) {
        const foulCount = gameEvents.filter(e => e.player === player.playerId && e.type === 'falta').length;
        if (foulCount >= 4) {
            const replacement = findBestReplacement(player, benchProfiles);
            if (replacement) {
                return {
                    type: 'SUSTITUCION',
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
                        type: 'SUSTITUCION',
                        playerOut: player,
                        playerIn: replacement,
                        reason: 'ha fallado sus últimos 3 tiros. Un cambio podría refrescar el ataque.'
                    };
                }
            }
        }
    }

    // Criterio 3: Pérdidas de Balón
    for (const player of onCourtProfiles) {
        const turnovers = gameEvents
            .filter(e => e.player === player.playerId && e.type === 'perdida')
            .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

        if (turnovers.length >= 3) {
            const replacement = findBestReplacement(player, benchProfiles);
            if (replacement) {
                return {
                    type: 'SUSTITUCION',
                    playerOut: player,
                    playerIn: replacement,
                    reason: 'ha acumulado 3 o más pérdidas de balón recientes. Un descanso podría ayudarle a enfocarse.'
                };
            }
        }
    }

    // Criterio 4: Estadísticas globales (Táctica)
    // Extraer los eventos de tu equipo (filtrando aquellos que coinciden con los IDs de todos tus jugadores)
    const teamPlayerIds = allPlayerProfiles.map(p => p.playerId);
    const teamEvents = gameEvents.filter(e => teamPlayerIds.includes(e.player));

    const last20Events = teamEvents.slice(0, 20); // Mirar los eventos recientes

    // Evaluar porcentaje de triples recientes
    const recent3PTShots = last20Events.filter(e => e.type === 'tiro' && e.details.value === 3);
    if (recent3PTShots.length >= 4) {
        const made3PT = recent3PTShots.filter(e => e.details.made).length;
        if (made3PT === 0) {
            return {
                type: 'TACTICA',
                reason: 'El equipo ha fallado los últimos intentos de triples. Consideren buscar opciones más cerca del aro o realizar jugadas de penetración y pase.'
            };
        }
    }

    // Evaluar acumulación de pérdidas recientes en el equipo
    const recentTurnovers = last20Events.filter(e => e.type === 'perdida').length;
    if (recentTurnovers >= 5) {
        return {
            type: 'TACTICA',
            reason: 'Se están acumulando muchas pérdidas de balón en poco tiempo. Pidan calma en ataque y aseguren los pases.'
        };
    }

    // Retorno positivo por defecto
    return {
        type: 'POSITIVA',
        reason: 'El equipo está manteniendo un ritmo de juego sólido, rotaciones y toma de decisiones equilibradas. Mantengan la intensidad actual y la concentración en defensa.'
    };
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
