import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

vi.mock('../../config', () => ({
  config: { apiBaseUrl: 'http://localhost:3000' },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeGeoResult(overrides?: Partial<{ place_id: number; display_name: string; lat: string; lon: string }>) {
  return {
    place_id: 282071899,
    display_name: 'Ciudad de México, México',
    lat: '19.4326296',
    lon: '-99.1331785',
    ...overrides,
  };
}

describe('SearchBar', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('when the user types and presses Enter', () => {
    it('SearchBar when query returns multiple results should display the list of results', async () => {
      // Arrange
      const results = [
        makeGeoResult({ place_id: 1, display_name: 'Ciudad de México, México' }),
        makeGeoResult({ place_id: 2, display_name: 'México, América del Norte' }),
      ];
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(results),
      });
      const onSelect = vi.fn();

      // Act
      render(<SearchBar onSelect={onSelect} onLocate={vi.fn()} />);
      await userEvent.type(screen.getByRole('textbox'), 'México');
      await userEvent.keyboard('{Enter}');

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Ciudad de México, México')).toBeInTheDocument();
        expect(screen.getByText('México, América del Norte')).toBeInTheDocument();
      });
    });

    it('SearchBar when query returns multiple results should display the result count', async () => {
      // Arrange
      const results = [
        makeGeoResult({ place_id: 1, display_name: 'Guadalajara, Jalisco, México' }),
        makeGeoResult({ place_id: 2, display_name: 'Guadalajara, España' }),
        makeGeoResult({ place_id: 3, display_name: 'Guadalajara, Illinois, Estados Unidos' }),
      ];
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(results) });

      // Act
      render(<SearchBar onSelect={vi.fn()} onLocate={vi.fn()} />);
      await userEvent.type(screen.getByRole('textbox'), 'Guadalajara');
      await userEvent.keyboard('{Enter}');

      // Assert
      await waitFor(() => {
        expect(screen.getByText('3 resultados')).toBeInTheDocument();
      });
    });

    it('SearchBar when the API returns a single result should auto-select it and call onSelect', async () => {
      // Arrange
      const result = makeGeoResult({ place_id: 99, display_name: 'Oaxaca de Juárez, Oaxaca, México' });
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve([result]) });
      const onSelect = vi.fn();

      // Act
      render(<SearchBar onSelect={onSelect} onLocate={vi.fn()} />);
      await userEvent.type(screen.getByRole('textbox'), 'Oaxaca');
      await userEvent.keyboard('{Enter}');

      // Assert
      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledOnce();
        expect(onSelect).toHaveBeenCalledWith(result);
      });
    });
  });

  describe('when the user clicks the search button', () => {
    it('SearchBar when the search button is clicked with a query should call the API with the correct URL', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve([]) });

      // Act
      render(<SearchBar onSelect={vi.fn()} onLocate={vi.fn()} />);
      await userEvent.type(screen.getByRole('textbox'), 'Monterrey');
      await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

      // Assert
      await waitFor(() => {
        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('http://localhost:3000/geo/geocode');
        expect(calledUrl).toContain('q=Monterrey');
      });
    });

    it('SearchBar when the input is empty and search is clicked should not call the API', async () => {
      // Arrange & Act
      render(<SearchBar onSelect={vi.fn()} onLocate={vi.fn()} />);
      await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

      // Assert
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('when a result is selected', () => {
    it('SearchBar when a result is clicked should call onSelect with the selected result', async () => {
      // Arrange
      const results = [
        makeGeoResult({ place_id: 10, display_name: 'Puebla, México' }),
        makeGeoResult({ place_id: 11, display_name: 'Puebla de Zaragoza, Puebla, México' }),
      ];
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(results) });
      const onSelect = vi.fn();

      // Act
      render(<SearchBar onSelect={onSelect} onLocate={vi.fn()} />);
      await userEvent.type(screen.getByRole('textbox'), 'Puebla');
      await userEvent.keyboard('{Enter}');
      await waitFor(() => screen.getByText('Puebla, México'));
      await userEvent.click(screen.getByText('Puebla, México'));

      // Assert
      expect(onSelect).toHaveBeenCalledWith(results[0]);
    });
  });

  describe('when the close button is clicked', () => {
    it('SearchBar when the results close button is clicked should hide the result list', async () => {
      // Arrange
      const results = [
        makeGeoResult({ place_id: 20, display_name: 'Tijuana, Baja California, México' }),
        makeGeoResult({ place_id: 21, display_name: 'Tijuana, Chile' }),
      ];
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(results) });

      // Act
      render(<SearchBar onSelect={vi.fn()} onLocate={vi.fn()} />);
      await userEvent.type(screen.getByRole('textbox'), 'Tijuana');
      await userEvent.keyboard('{Enter}');
      await waitFor(() => screen.getByText('Tijuana, Baja California, México'));
      await userEvent.click(screen.getByRole('button', { name: 'Cerrar resultados' }));

      // Assert
      expect(screen.queryByText('Tijuana, Baja California, México')).not.toBeInTheDocument();
    });
  });

  describe('when the locate button is clicked', () => {
    it('SearchBar when the locate button is clicked should call onLocate', async () => {
      // Arrange
      const onLocate = vi.fn();

      // Act
      render(<SearchBar onSelect={vi.fn()} onLocate={onLocate} />);
      await userEvent.click(screen.getByRole('button', { name: 'Centrar en mi ubicación' }));

      // Assert
      expect(onLocate).toHaveBeenCalledOnce();
    });
  });
});
