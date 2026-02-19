import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SavedList from './SavedList';

const emptyProps = {
  savedRides: [],
  savedAvoidZones: [],
  onDeleteRide: vi.fn(),
  onDeleteAvoidZone: vi.fn(),
};

describe('SavedList', () => {
  describe('when there are no saved rides or avoid zones', () => {
    it('SavedList when both lists are empty should display empty state messages', () => {
      // Arrange & Act
      render(<SavedList {...emptyProps} />);

      // Assert
      expect(screen.getByText('No hay rutas guardadas.')).toBeInTheDocument();
      expect(screen.getByText('No hay zonas guardadas.')).toBeInTheDocument();
    });

    it('SavedList when lists are empty should show counts as zero in group titles', () => {
      // Arrange & Act
      render(<SavedList {...emptyProps} />);

      // Assert
      expect(screen.getByText('Rutas (0)')).toBeInTheDocument();
      expect(screen.getByText('Zonas a evitar (0)')).toBeInTheDocument();
    });
  });

  describe('when there are saved rides', () => {
    it('SavedList when given two saved rides should render both ride names and km', () => {
      // Arrange
      const props = {
        ...emptyProps,
        savedRides: [
          { id: 'ride-1', name: 'Ruta Chapultepec', km: 8.45, points: 34 },
          { id: 'ride-2', name: 'Circuito Alameda', km: 3.2, points: 15 },
        ],
      };

      // Act
      render(<SavedList {...props} />);

      // Assert
      expect(screen.getByText('Ruta Chapultepec')).toBeInTheDocument();
      expect(screen.getByText('8.45 km · 34 puntos')).toBeInTheDocument();
      expect(screen.getByText('Circuito Alameda')).toBeInTheDocument();
      expect(screen.getByText('3.20 km · 15 puntos')).toBeInTheDocument();
    });

    it('SavedList when a ride delete button is clicked should call onDeleteRide with the correct id', async () => {
      // Arrange
      const onDeleteRide = vi.fn();
      const props = {
        ...emptyProps,
        onDeleteRide,
        savedRides: [{ id: 'ride-cdmx-01', name: 'Paseo Reforma', km: 5.1, points: 22 }],
      };

      // Act
      render(<SavedList {...props} />);
      await userEvent.click(screen.getByRole('button', { name: 'Eliminar Paseo Reforma' }));

      // Assert
      expect(onDeleteRide).toHaveBeenCalledOnce();
      expect(onDeleteRide).toHaveBeenCalledWith('ride-cdmx-01');
    });
  });

  describe('when there are saved avoid zones', () => {
    it('SavedList when given an avoid zone should render its name and point count', () => {
      // Arrange
      const props = {
        ...emptyProps,
        savedAvoidZones: [{ id: 'zone-1', name: 'Zona Tepito', points: 8 }],
      };

      // Act
      render(<SavedList {...props} />);

      // Assert
      expect(screen.getByText('Zona Tepito')).toBeInTheDocument();
      expect(screen.getByText('8 puntos')).toBeInTheDocument();
    });

    it('SavedList when an avoid zone delete button is clicked should call onDeleteAvoidZone with the correct id', async () => {
      // Arrange
      const onDeleteAvoidZone = vi.fn();
      const props = {
        ...emptyProps,
        onDeleteAvoidZone,
        savedAvoidZones: [{ id: 'zone-centro-01', name: 'Centro Histórico', points: 12 }],
      };

      // Act
      render(<SavedList {...props} />);
      await userEvent.click(screen.getByRole('button', { name: 'Eliminar Centro Histórico' }));

      // Assert
      expect(onDeleteAvoidZone).toHaveBeenCalledOnce();
      expect(onDeleteAvoidZone).toHaveBeenCalledWith('zone-centro-01');
    });
  });
});
