import { useCallback, useEffect, useRef, type RefObject } from 'react';
import maplibregl from 'maplibre-gl';
import {
  RIDES_SOURCE,
  RIDES_LAYER,
  AVOID_SOURCE,
  AVOID_FILL_LAYER,
  AVOID_OUTLINE_LAYER,
  SELECTED_RIDE_SOURCE,
  SELECTED_RIDE_GLOW_LAYER,
  SELECTED_RIDE_LAYER,
  SELECTED_AVOID_SOURCE,
  SELECTED_AVOID_FILL_LAYER,
  SELECTED_AVOID_OUTLINE_LAYER,
  DRAFT_LINE_SOURCE,
  DRAFT_LINE_LAYER,
  DRAFT_POLYGON_SOURCE,
  DRAFT_POLYGON_FILL_LAYER,
  DRAFT_POLYGON_OUTLINE_LAYER,
  createFeatureCollection,
  type FeatureCollection,
} from '../lib/mapLayers';

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

export function useMapInstance(containerRef: RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<maplibregl.Map | null>(null);

  const updateSourceData = useCallback(
    <T extends GeoJSON.Geometry>(sourceId: string, data: FeatureCollection<T>) => {
      const map = mapRef.current;
      if (!map) return;
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      source?.setData(data as GeoJSON.GeoJSON);
    },
    [],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [0, 20],
      zoom: 2,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      const emptyLines = createFeatureCollection<GeoJSON.LineString>([]) as GeoJSON.GeoJSON;
      const emptyPolygons = createFeatureCollection<GeoJSON.Polygon>([]) as GeoJSON.GeoJSON;

      map.addSource(RIDES_SOURCE, { type: 'geojson', data: emptyLines });
      map.addLayer({
        id: RIDES_LAYER,
        type: 'line',
        source: RIDES_SOURCE,
        paint: { 'line-color': '#60a5fa', 'line-width': 4, 'line-opacity': 0.72 },
      });

      map.addSource(AVOID_SOURCE, { type: 'geojson', data: emptyPolygons });
      map.addLayer({
        id: AVOID_FILL_LAYER,
        type: 'fill',
        source: AVOID_SOURCE,
        paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.18 },
      });
      map.addLayer({
        id: AVOID_OUTLINE_LAYER,
        type: 'line',
        source: AVOID_SOURCE,
        paint: { 'line-color': '#dc2626', 'line-width': 2, 'line-dasharray': [2, 2] },
      });

      map.addSource(SELECTED_RIDE_SOURCE, { type: 'geojson', data: emptyLines });
      map.addLayer({
        id: SELECTED_RIDE_GLOW_LAYER,
        type: 'line',
        source: SELECTED_RIDE_SOURCE,
        paint: { 'line-color': '#ffffff', 'line-width': 13, 'line-opacity': 0.85 },
      });
      map.addLayer({
        id: SELECTED_RIDE_LAYER,
        type: 'line',
        source: SELECTED_RIDE_SOURCE,
        paint: { 'line-color': '#ff6600', 'line-width': 7, 'line-opacity': 1 },
      });

      map.addSource(SELECTED_AVOID_SOURCE, { type: 'geojson', data: emptyPolygons });
      map.addLayer({
        id: SELECTED_AVOID_FILL_LAYER,
        type: 'fill',
        source: SELECTED_AVOID_SOURCE,
        paint: { 'fill-color': '#f97316', 'fill-opacity': 0.3 },
      });
      map.addLayer({
        id: SELECTED_AVOID_OUTLINE_LAYER,
        type: 'line',
        source: SELECTED_AVOID_SOURCE,
        paint: { 'line-color': '#f97316', 'line-width': 3 },
      });

      map.addSource(DRAFT_LINE_SOURCE, { type: 'geojson', data: emptyLines });
      map.addLayer({
        id: DRAFT_LINE_LAYER,
        type: 'line',
        source: DRAFT_LINE_SOURCE,
        paint: { 'line-color': '#22c55e', 'line-width': 4, 'line-opacity': 0.95 },
      });

      map.addSource(DRAFT_POLYGON_SOURCE, { type: 'geojson', data: emptyPolygons });
      map.addLayer({
        id: DRAFT_POLYGON_FILL_LAYER,
        type: 'fill',
        source: DRAFT_POLYGON_SOURCE,
        paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.22 },
      });
      map.addLayer({
        id: DRAFT_POLYGON_OUTLINE_LAYER,
        type: 'line',
        source: DRAFT_POLYGON_SOURCE,
        paint: { 'line-color': '#ef4444', 'line-width': 2 },
      });

      navigator.geolocation.getCurrentPosition(({ coords }) => {
        map.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14, speed: 1.4 });
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [containerRef]);

  return { mapRef, updateSourceData };
}
