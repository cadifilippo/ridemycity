import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DrawingPanel from './DrawingPanel';

describe('DrawingPanel', () => {
  describe('when in ride mode', () => {
    it('DrawingPanel when drawingMode is "ride" should display "Dibujando ruta" label', () => {
      // Arrange
      const props = {
        drawingMode: 'ride' as const,
        estimatedKm: 0,
        onStopDrawing: vi.fn(),
        onUndo: vi.fn(),
        onSave: vi.fn(),
      };

      // Act
      render(<DrawingPanel {...props} />);

      // Assert
      expect(screen.getByText('Dibujando ruta')).toBeInTheDocument();
    });

    it('DrawingPanel when drawingMode is "ride" should show the estimated km formatted to 2 decimals', () => {
      // Arrange
      const props = {
        drawingMode: 'ride' as const,
        estimatedKm: 12.3456,
        onStopDrawing: vi.fn(),
        onUndo: vi.fn(),
        onSave: vi.fn(),
      };

      // Act
      render(<DrawingPanel {...props} />);

      // Assert
      expect(screen.getByText('12.35')).toBeInTheDocument();
      expect(screen.getByText('km')).toBeInTheDocument();
    });
  });

  describe('when in avoid zone mode', () => {
    it('DrawingPanel when drawingMode is "avoid" should display "Zona a evitar" label', () => {
      // Arrange
      const props = {
        drawingMode: 'avoid' as const,
        estimatedKm: 0,
        onStopDrawing: vi.fn(),
        onUndo: vi.fn(),
        onSave: vi.fn(),
      };

      // Act
      render(<DrawingPanel {...props} />);

      // Assert
      expect(screen.getByText('Zona a evitar')).toBeInTheDocument();
    });

    it('DrawingPanel when drawingMode is "avoid" should not display the km counter', () => {
      // Arrange
      const props = {
        drawingMode: 'avoid' as const,
        estimatedKm: 5.5,
        onStopDrawing: vi.fn(),
        onUndo: vi.fn(),
        onSave: vi.fn(),
      };

      // Act
      render(<DrawingPanel {...props} />);

      // Assert
      expect(screen.queryByText('km')).not.toBeInTheDocument();
    });
  });

  describe('when buttons are clicked', () => {
    it('DrawingPanel when the cancel button is clicked should call onStopDrawing', async () => {
      // Arrange
      const onStopDrawing = vi.fn();
      const props = {
        drawingMode: 'ride' as const,
        estimatedKm: 0,
        onStopDrawing,
        onUndo: vi.fn(),
        onSave: vi.fn(),
      };

      // Act
      render(<DrawingPanel {...props} />);
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      // Assert
      expect(onStopDrawing).toHaveBeenCalledOnce();
    });

    it('DrawingPanel when the undo button is clicked should call onUndo', async () => {
      // Arrange
      const onUndo = vi.fn();
      const props = {
        drawingMode: 'ride' as const,
        estimatedKm: 0,
        onStopDrawing: vi.fn(),
        onUndo,
        onSave: vi.fn(),
      };

      // Act
      render(<DrawingPanel {...props} />);
      await userEvent.click(screen.getByRole('button', { name: /deshacer/i }));

      // Assert
      expect(onUndo).toHaveBeenCalledOnce();
    });

    it('DrawingPanel when the save button is clicked should call onSave', async () => {
      // Arrange
      const onSave = vi.fn();
      const props = {
        drawingMode: 'avoid' as const,
        estimatedKm: 0,
        onStopDrawing: vi.fn(),
        onUndo: vi.fn(),
        onSave,
      };

      // Act
      render(<DrawingPanel {...props} />);
      await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

      // Assert
      expect(onSave).toHaveBeenCalledOnce();
    });
  });
});
