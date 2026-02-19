import { Injectable, InternalServerErrorException } from '@nestjs/common';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_RESULTS_LIMIT = '5';
const USER_AGENT = 'RideMyCity/1.0';
const ACCEPT_LANGUAGE = 'es';

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

export interface GeoJSONGeometry {
  type: string;
  coordinates: unknown;
}

export interface BoundaryResult {
  display_name: string;
  geojson: GeoJSONGeometry;
  boundingbox: [string, string, string, string];
}

@Injectable()
export class GeoService {
  async geocode(query: string): Promise<NominatimResult[]> {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', NOMINATIM_RESULTS_LIMIT);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': ACCEPT_LANGUAGE,
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Nominatim responded with ${response.status}`,
      );
    }

    return response.json() as Promise<NominatimResult[]>;
  }

  async getBoundary(query: string): Promise<BoundaryResult | null> {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('polygon_geojson', '1');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': ACCEPT_LANGUAGE,
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Nominatim responded with ${response.status}`,
      );
    }

    const results = await (response.json() as Promise<BoundaryResult[]>);
    const first = results[0];

    if (!first?.geojson || first.geojson.type === 'Point') {
      return null;
    }

    return first;
  }
}
