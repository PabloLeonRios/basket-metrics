// src/components/help/HelpContent.tsx
'use client';

import React from 'react';

const HelpSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 border-b-2 border-blue-500 pb-2">{title}</h2>
    {children}
  </div>
);

const Definition = ({ term, definition }: { term: string, definition: string }) => (
  <div className="mb-3">
    <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">{term}</p>
    <p className="text-gray-600 dark:text-gray-300 ml-2">{definition}</p>
  </div>
);

const Formula = ({ name, formula, explanation }: { name: string, formula: string, explanation: string }) => (
    <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
      <p className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400">{name}</p>
      <p className="font-mono text-gray-800 dark:text-gray-200 my-2 bg-gray-200 dark:bg-gray-900 p-2 rounded-md inline-block">{formula}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{explanation}</p>
    </div>
);


export default function HelpContent() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">Glosario de Estadísticas y Ayuda</h1>

      <HelpSection title="Abreviaturas de Estadísticas Básicas">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
                <Definition term="PTS" definition="Puntos Anotados Totales" />
                <Definition term="REB" definition="Rebotes Totales" />
                <Definition term="OREB" definition="Rebotes Ofensivos" />
                <Definition term="DREB" definition="Rebotes Defensivos" />
            </div>
            <div>
                <Definition term="AST" definition="Asistencias" />
                <Definition term="STL" definition="Robos (Steals)" />
                <Definition term="BLK" definition="Tapones (Blocks)" />
                <Definition term="TOV" definition="Pérdidas de Balón (Turnovers)" />
            </div>
            <div>
                <Definition term="PF" definition="Faltas Personales" />
                <Definition term="FGM / FGA" definition="Tiros de Campo Anotados / Intentados" />
                <Definition term="3PM / 3PA" definition="Tiros de 3 Puntos Anotados / Intentados" />
                <Definition term="FTM / FTA" definition="Tiros Libres Anotados / Intentados" />
                <Definition term="Game Score" definition="Valoración individual del rendimiento en un partido específico (ver fórmula avanzada)." />
            </div>
        </div>
      </HelpSection>

      <HelpSection title="Fórmulas de Estadísticas Avanzadas">
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          Estas métricas ofrecen una visión más profunda del rendimiento de un jugador o equipo, más allá de las estadísticas tradicionales.
        </p>
        
        <Formula 
          name="eFG% (Effective Field Goal Percentage)"
          formula="(FGM + 0.5 * 3PM) / FGA"
          explanation="Ajusta el porcentaje de tiros de campo para darle el valor adicional a los triples. Un triple anotado vale 1.5 veces un tiro de dos puntos en esta métrica, reflejando su impacto real en el marcador."
        />

        <Formula 
          name="TS% (True Shooting Percentage)"
          formula="Puntos / (2 * (FGA + 0.44 * FTA))"
          explanation="Mide la eficiencia de un jugador al anotar, teniendo en cuenta tiros de campo, triples y tiros libres. Es una de las mejores métricas para evaluar la eficiencia ofensiva global de un jugador."
        />
        
        <Formula 
          name="Game Score (Hollinger)"
          formula="(PTS) + (0.4*FGM) - (0.7*FGA) - (0.4*(FTA-FTM)) + (0.7*OREB) + (0.3*DREB) + STL + (0.7*AST) + (0.7*BLK) - (0.4*PF) - TOV"
          explanation="Una métrica creada por John Hollinger para dar una valoración en un solo número del rendimiento de un jugador en un partido específico. Valora positivamente las acciones ofensivas y defensivas eficientes y resta las ineficiencias."
        />

        <Formula 
          name="Posesiones (Estimación de Dean Oliver)"
          formula="FGA - OREB + TOV + (0.44 * FTA)"
          explanation="Una estimación del número de posesiones que un equipo o jugador ha utilizado. Es la base para calcular los Ratings Ofensivo y Defensivo, ya que permite analizar la eficiencia por cada 100 posesiones."
        />

        <Formula 
          name="Rating Ofensivo (ORtg)"
          formula="(Puntos / Posesiones) * 100"
          explanation="Puntos anotados por un equipo o jugador por cada 100 posesiones. Mide la eficiencia ofensiva independientemente del ritmo de juego."
        />
        
        <Formula 
          name="Rating Defensivo (DRtg)"
          formula="(Puntos Oponente / Posesiones Oponente) * 100"
          explanation="Puntos recibidos por un equipo o jugador por cada 100 posesiones. Mide la eficiencia defensiva."
        />

        <Definition 
          term="Idoneidad (Suitability Score)" 
          definition="Una puntuación generada por el Asistente de IA que indica qué tan adecuado es un jugador para una situación de partido específica, considerando sus perfiles y estadísticas." 
        />
      </HelpSection>
    </div>
  );
}
