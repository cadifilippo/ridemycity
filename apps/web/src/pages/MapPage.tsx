import { useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapPage.css';
import apiClient from '../lib/apiClient';
import { clearBoundary, drawBoundary } from '../lib/mapLayers';
import { calculateDistanceKm } from '../lib/geo';
import { type CityGeometry, type GeoResult } from '../types';
import { useMapInstance } from '../hooks/useMapInstance';
import { useSavedShapes } from '../hooks/useSavedShapes';
import { useDrawing } from '../hooks/useDrawing';
import { useSelection } from '../hooks/useSelection';
import RideSidebar from '../components/RideSidebar/RideSidebar';

const EMPTY_STATS = { totalKm: 0, cityExplored: 0, totalRides: 0 };

export default function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { mapRef, updateSourceData } = useMapInstance(containerRef);
  const { savedRides, savedAvoidZones, addRide, addAvoidZone, deleteRide, deleteAvoidZone } =
    useSavedShapes(updateSourceData);
  const {
    drawingMode,
    estimatedKm,
    handleStartRide,
    handleStartAvoidZone,
    handleStopDrawing,
    handleUndo,
    handleSave,
  } = useDrawing(mapRef, updateSourceData, { addRide, addAvoidZone });
  const { selectedRideId, selectedAvoidId, handleSelectRide, handleSelectAvoidZone } = useSelection(
    mapRef,
    savedRides,
    savedAvoidZones,
    updateSourceData,
  );

  function handleDeleteRide(id: string) {
    if (selectedRideId === id) handleSelectRide(id);
    deleteRide(id);
  }

  function handleDeleteAvoidZone(id: string) {
    if (selectedAvoidId === id) handleSelectAvoidZone(id);
    deleteAvoidZone(id);
  }

  async function handleSearchSelect(result: GeoResult) {
    if (mapRef.current) clearBoundary(mapRef.current);
    mapRef.current?.flyTo({
      center: [parseFloat(result.lon), parseFloat(result.lat)],
      zoom: 14,
      speed: 1.4,
    });
    const res = await apiClient.get<{ geojson: CityGeometry }>(
      `/geo/boundary?q=${encodeURIComponent(result.display_name)}`,
    );
    if (mapRef.current) drawBoundary(mapRef.current, res.data.geojson);
  }

  function handleLocate() {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (mapRef.current) clearBoundary(mapRef.current);
      mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14, speed: 1.4 });
    });
  }

  return (
    <div className="map-wrapper">
      <div ref={containerRef} className="map-container" />
      <RideSidebar
        drawingMode={drawingMode}
        estimatedKm={estimatedKm}
        stats={EMPTY_STATS}
        savedRides={savedRides.map((ride, index) => ({
          id: ride.id,
          name: `Salida ${index + 1}`,
          km: calculateDistanceKm(ride.coordinates),
          points: ride.coordinates.length,
        }))}
        savedAvoidZones={savedAvoidZones.map((zone, index) => ({
          id: zone.id,
          name: `Zona ${index + 1}`,
          points: Math.max(zone.coordinates.length - 1, 0),
        }))}
        onStartRide={handleStartRide}
        onStartAvoidZone={handleStartAvoidZone}
        onStopDrawing={handleStopDrawing}
        onUndo={handleUndo}
        onSave={handleSave}
        onDeleteRide={handleDeleteRide}
        onDeleteAvoidZone={handleDeleteAvoidZone}
        onSelectRide={handleSelectRide}
        onSelectAvoidZone={handleSelectAvoidZone}
        selectedRideId={selectedRideId}
        selectedAvoidId={selectedAvoidId}
        onSearchSelect={handleSearchSelect}
        onLocate={handleLocate}
      />
    </div>
  );
}
