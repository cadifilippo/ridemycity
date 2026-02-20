import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsPanel from './StatsPanel';

describe('StatsPanel', () => {
  describe('when rendered with valid stats', () => {
    it('StatsPanel when given totalKm and totalRides should display both stat values', () => {
      // Arrange
      const stats = { totalKm: 142.5, totalRides: 27 };

      // Act
      render(<StatsPanel stats={stats} />);

      // Assert
      expect(screen.getByText('142.5 km')).toBeInTheDocument();
      expect(screen.getByText('27')).toBeInTheDocument();
    });

    it('StatsPanel when rendered should display the section heading "Estadísticas"', () => {
      // Arrange
      const stats = { totalKm: 0, totalRides: 0 };

      // Act
      render(<StatsPanel stats={stats} />);

      // Assert
      expect(screen.getByText('Estadísticas')).toBeInTheDocument();
    });

    it('StatsPanel when rendered should display descriptive labels for each stat', () => {
      // Arrange
      const stats = { totalKm: 10, totalRides: 3 };

      // Act
      render(<StatsPanel stats={stats} />);

      // Assert
      expect(screen.getByText('Total recorrido')).toBeInTheDocument();
      expect(screen.getByText('Rides completados')).toBeInTheDocument();
    });
  });

  describe('when rendered with zero stats', () => {
    it('StatsPanel when all stats are zero should still display zeros without errors', () => {
      // Arrange
      const stats = { totalKm: 0, totalRides: 0 };

      // Act
      render(<StatsPanel stats={stats} />);

      // Assert
      expect(screen.getByText('0 km')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
