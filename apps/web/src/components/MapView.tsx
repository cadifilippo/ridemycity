import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './MapView.css'
import { type GeoResult } from './SearchBar'
import RideSidebar from './RideSidebar'

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
}

const EMPTY_STATS = { totalKm: 0, cityExplored: 0, totalRides: 0 }

const API_BASE = 'http://localhost:3000'
const MASK_SOURCE = 'city-mask'
const MASK_LAYER = 'city-mask-fill'
const BOUNDARY_SOURCE = 'city-boundary'
const BOUNDARY_LINE = 'city-boundary-line'

// Full-world bounding ring used as the outer polygon of the inverted mask
const WORLD_RING: [number, number][] = [
  [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90],
]

type PolygonGeometry = { type: 'Polygon'; coordinates: number[][][] }
type MultiPolygonGeometry = { type: 'MultiPolygon'; coordinates: number[][][][] }
type CityGeometry = PolygonGeometry | MultiPolygonGeometry

function createInvertedMask(geojson: CityGeometry) {
  const holes =
    geojson.type === 'Polygon'
      ? [geojson.coordinates[0]]
      : geojson.coordinates.map((polygon) => polygon[0])

  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [WORLD_RING, ...holes] },
    properties: {},
  }
}

function clearBoundary(map: maplibregl.Map) {
  if (map.getLayer(MASK_LAYER)) map.removeLayer(MASK_LAYER)
  if (map.getLayer(BOUNDARY_LINE)) map.removeLayer(BOUNDARY_LINE)
  if (map.getSource(MASK_SOURCE)) map.removeSource(MASK_SOURCE)
  if (map.getSource(BOUNDARY_SOURCE)) map.removeSource(BOUNDARY_SOURCE)
}

function drawBoundary(map: maplibregl.Map, geojson: CityGeometry) {
  clearBoundary(map)

  // World minus city → grey overlay outside
  map.addSource(MASK_SOURCE, {
    type: 'geojson',
    data: createInvertedMask(geojson) as never,
  })
  map.addLayer({
    id: MASK_LAYER,
    type: 'fill',
    source: MASK_SOURCE,
    paint: { 'fill-color': '#64748b', 'fill-opacity': 0.45 },
  })

  // City border
  map.addSource(BOUNDARY_SOURCE, {
    type: 'geojson',
    data: { type: 'Feature', geometry: geojson, properties: {} } as never,
  })
  map.addLayer({
    id: BOUNDARY_LINE,
    type: 'line',
    source: BOUNDARY_SOURCE,
    paint: { 'line-color': '#2563eb', 'line-width': 2 },
  })
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [drawingMode, setDrawingMode] = useState<'ride' | 'avoid' | null>(null)
  const [estimatedKm, setEstimatedKm] = useState(0)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [0, 20],
      zoom: 2,
    })

    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        map.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 14,
          speed: 1.4,
        })
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  async function handleResultSelect(result: GeoResult) {
    if (mapRef.current) clearBoundary(mapRef.current)

    mapRef.current?.flyTo({
      center: [parseFloat(result.lon), parseFloat(result.lat)],
      zoom: 14,
      speed: 1.4,
    })

    const res = await fetch(
      `${API_BASE}/geo/boundary?q=${encodeURIComponent(result.display_name)}`,
    )
    if (res.ok) {
      const { geojson } = await res.json() as { geojson: CityGeometry }
      if (mapRef.current) drawBoundary(mapRef.current, geojson)
    }
  }

  function handleLocate() {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      mapRef.current?.flyTo({
        center: [coords.longitude, coords.latitude],
        zoom: 14,
        speed: 1.4,
      })
    })
  }

  function handleStopDrawing() {
    setDrawingMode(null)
    setEstimatedKm(0)
  }

  function handleSave() {
    // TODO: persist ride/zone
    setDrawingMode(null)
    setEstimatedKm(0)
  }

  return (
    <div className="map-wrapper">
      <div ref={containerRef} className="map-container" />
      <RideSidebar
        drawingMode={drawingMode}
        estimatedKm={estimatedKm}
        stats={EMPTY_STATS}
        onStartRide={() => setDrawingMode('ride')}
        onStartAvoidZone={() => setDrawingMode('avoid')}
        onStopDrawing={handleStopDrawing}
        onUndo={() => {}}
        onSave={handleSave}
        onSearchSelect={handleResultSelect}
        onLocate={handleLocate}
      />
    </div>
  )
}
