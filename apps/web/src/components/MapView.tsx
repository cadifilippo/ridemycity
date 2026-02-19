import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './MapView.css'
import SearchBar, { type GeoResult } from './SearchBar'

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

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

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
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          map.flyTo({
            center: [coords.longitude, coords.latitude],
            zoom: 14,
            speed: 1.4,
          })
        },
      )
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  function handleResultSelect(result: GeoResult) {
    mapRef.current?.flyTo({
      center: [parseFloat(result.lon), parseFloat(result.lat)],
      zoom: 14,
      speed: 1.4,
    })
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

  return (
    <div className="map-wrapper">
      <div ref={containerRef} className="map-container" />
      <SearchBar onSelect={handleResultSelect} onLocate={handleLocate} />
    </div>
  )
}
