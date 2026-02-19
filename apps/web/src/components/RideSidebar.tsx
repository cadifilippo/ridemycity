import { useState } from 'react'
import {
  Bike,
  Plus,
  ShieldAlert,
  Route,
  MapPinned,
  Activity,
  Undo2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import './RideSidebar.css'
import SearchBar, { type GeoResult } from './SearchBar'

const SIDEBAR_WIDTH = 320

interface Stats {
  totalKm: number
  cityExplored: number
  totalRides: number
}

export interface RideSidebarProps {
  drawingMode: 'ride' | 'avoid' | null
  estimatedKm: number
  stats: Stats
  onStartRide: () => void
  onStartAvoidZone: () => void
  onStopDrawing: () => void
  onUndo: () => void
  onSave: () => void
  onSearchSelect: (result: GeoResult) => void
  onLocate: () => void
}

export default function RideSidebar({
  drawingMode,
  estimatedKm,
  stats,
  onStartRide,
  onStartAvoidZone,
  onStopDrawing,
  onUndo,
  onSave,
  onSearchSelect,
  onLocate,
}: RideSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

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
          <div>
            <h1 className="sidebar-title">RideMyCity</h1>
            <p className="sidebar-subtitle">Mi ciudad</p>
          </div>
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
            <div className="drawing-panel">
              <div className="drawing-panel-header">
                <span className="drawing-panel-label">
                  {drawingMode === 'ride' ? 'Dibujando ruta' : 'Zona a evitar'}
                </span>
                <button className="btn-icon" onClick={onStopDrawing} aria-label="Cancelar">
                  <X size={16} />
                </button>
              </div>

              {drawingMode === 'ride' && (
                <div className="drawing-km">
                  <span className="drawing-km-value">{estimatedKm.toFixed(2)}</span>
                  <span className="drawing-km-unit">km</span>
                </div>
              )}

              <div className="drawing-actions">
                <button className="btn btn--secondary" onClick={onUndo}>
                  <Undo2 size={16} />
                  Deshacer
                </button>
                <button className="btn btn--primary" onClick={onSave}>
                  <Save size={16} />
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-stats">
          <p className="stats-heading">Estadísticas</p>

          <div className="stat-item">
            <div className="stat-icon stat-icon--primary">
              <Route size={16} />
            </div>
            <div>
              <p className="stat-value">{stats.totalKm} km</p>
              <p className="stat-desc">Total recorrido</p>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon stat-icon--green">
              <MapPinned size={16} />
            </div>
            <div>
              <p className="stat-value">{stats.cityExplored}%</p>
              <p className="stat-desc">Ciudad explorada</p>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon stat-icon--muted">
              <Activity size={16} />
            </div>
            <div>
              <p className="stat-value">{stats.totalRides}</p>
              <p className="stat-desc">Rides completados</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
