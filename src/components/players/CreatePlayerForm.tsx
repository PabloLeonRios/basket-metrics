'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import { toast } from 'react-toastify';

export default function CreatePlayerForm() {
  const { user } = useAuth();
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [dorsal, setDorsal] = useState('');
  const [position, setPosition] = useState('');
  const [team, setTeam] = useState('');
  const [isRival, setIsRival] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const labelStyles =
    'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Debes estar autenticado para crear un jugador.');
      return;
    }
    setIsSubmitting(true);
    try {
      const newPlayerData = {
        name,
        dorsal: Number(dorsal),
        position,
        team: team || (isRival ? 'Equipo Rival' : user.team?.name),
        coach: user._id,
        isRival,
      };
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlayerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo crear el jugador.');
      }

      toast.success('Jugador creado con éxito. Redirigiendo a la lista...');

      // Redirect to the player list page
      router.push('/panel/players');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al crear el jugador.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Añadir Nuevo Jugador</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="name" className={labelStyles}>
              Nombre del Jugador
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: Michael Jordan"
            />
          </div>
          <div>
            <label htmlFor="dorsal" className={labelStyles}>
              Dorsal
            </label>
            <Input
              id="dorsal"
              type="number"
              value={dorsal}
              onChange={(e) => setDorsal(e.target.value)}
              placeholder="Ej: 23"
            />
          </div>
          <div>
            <label htmlFor="position" className={labelStyles}>
              Posición
            </label>
            <Input
              id="position"
              type="text"
              list="position-options"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Ej: Escolta"
            />
            <datalist id="position-options">
              <option value="Base" />
              <option value="Escolta" />
              <option value="Alero" />
              <option value="Ala-Pívot" />
              <option value="Pívot" />
            </datalist>
          </div>
          <div>
            <label htmlFor="team" className={labelStyles}>
              Equipo (Opcional)
            </label>
            <Input
              id="team"
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder={
                isRival
                  ? 'Ej: Equipo Rival'
                  : user?.team?.name || 'Ej: Mi Equipo'
              }
            />
          </div>
        </div>
        <div className="py-2">
          <Checkbox
            label="Es jugador rival"
            checked={isRival}
            onChange={(e) => setIsRival(e.target.checked)}
          />
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="md"
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Creando...' : 'Guardar Jugador'}
        </Button>
      </form>
    </div>
  );
}
