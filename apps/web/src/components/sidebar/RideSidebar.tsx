import { useState } from 'react';
import { Bike, Plus, ShieldAlert, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import './RideSidebar.css';
import SearchBar from '../SearchBar';
import DrawingPanel from './DrawingPanel';
import SavedList from './SavedList';
import StatsPanel from './StatsPanel';
import { useAuth } from '../../context/AuthContext';
import { type DrawingMode, type Stats, type GeoResult } from '../../types';

const SIDEBAR_WIDTH = 320;

export interface RideSidebarProps {
  drawingMode: DrawingMode;
  estimatedKm: number;
  stats: Stats;
  savedRides: Array<{ id: string; name: string; km: number; points: number }>;
  savedAvoidZones: Array<{ id: string; name: string; points: number }>;
  onStartRide: () => void;
  onStartAvoidZone: () => void;
  onStopDrawing: () => void;
  onUndo: () => void;
  onSave: () => void;
  onDeleteRide: (id: string) => void;
  onDeleteAvoidZone: (id: string) => void;
  onSelectRide: (id: string) => void;
  onSelectAvoidZone: (id: string) => void;
  selectedRideId: string | null;
  selectedAvoidId: string | null;
  onSearchSelect: (result: GeoResult) => void;
  onLocate: () => void;
}

export default function RideSidebar({
  drawingMode,
  estimatedKm,
  stats,
  savedRides,
  savedAvoidZones,
  onStartRide,
  onStartAvoidZone,
  onStopDrawing,
  onUndo,
  onSave,
  onDeleteRide,
  onDeleteAvoidZone,
  onSelectRide,
  onSelectAvoidZone,
  selectedRideId,
  selectedAvoidId,
  onSearchSelect,
  onLocate,
}: RideSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <div className="sidebar-wrapper">
      <button
        className="sidebar-toggle"
        style={{ left: collapsed ? 0 : SIDEBAR_WIDTH }}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expandir panel' : 'Colapsar panel'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Bike size={20} />
          </div>
          <div className="sidebar-header-info">
            <h1 className="sidebar-title">RideMyCity</h1>
            <p className="sidebar-subtitle">{user?.displayName ?? 'Mi ciudad'}</p>
          </div>
          <button className="btn-icon sidebar-logout" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>

        <div className="sidebar-search">
          <SearchBar onSelect={onSearchSelect} onLocate={onLocate} />
        </div>

        <div className="sidebar-actions">
          {!drawingMode ? (
            <>
              <button className="btn btn--primary" onClick={onStartRide}>
                <Plus size={18} />
                Nueva Ruta
              </button>
              <button className="btn btn--danger" onClick={onStartAvoidZone}>
                <ShieldAlert size={18} />
                Zona a Evitar
              </button>
            </>
          ) : (
            <DrawingPanel
              drawingMode={drawingMode}
              estimatedKm={estimatedKm}
              onStopDrawing={onStopDrawing}
              onUndo={onUndo}
              onSave={onSave}
            />
          )}
        </div>

        <SavedList
          savedRides={savedRides}
          savedAvoidZones={savedAvoidZones}
          onDeleteRide={onDeleteRide}
          onDeleteAvoidZone={onDeleteAvoidZone}
          onSelectRide={onSelectRide}
          onSelectAvoidZone={onSelectAvoidZone}
          selectedRideId={selectedRideId}
          selectedAvoidId={selectedAvoidId}
        />

        <StatsPanel stats={stats} />
      </aside>
    </div>
  );
}
