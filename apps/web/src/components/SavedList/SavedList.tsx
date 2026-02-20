import { Trash2 } from 'lucide-react';
import './SavedList.css';

interface Props {
  savedRides: Array<{ id: string; name: string; km: number; points: number }>;
  savedAvoidZones: Array<{ id: string; name: string; points: number }>;
  onDeleteRide: (id: string) => void;
  onDeleteAvoidZone: (id: string) => void;
  onSelectRide: (id: string) => void;
  onSelectAvoidZone: (id: string) => void;
  selectedRideId: string | null;
  selectedAvoidId: string | null;
}

export default function SavedList({
  savedRides,
  savedAvoidZones,
  onDeleteRide,
  onDeleteAvoidZone,
  onSelectRide,
  onSelectAvoidZone,
  selectedRideId,
  selectedAvoidId,
}: Props) {
  return (
    <div className="sidebar-saved">
      <p className="saved-heading">Guardados</p>

      <div className="saved-group">
        <p className="saved-group-title">Salidas ({savedRides.length})</p>
        {savedRides.length === 0 ? (
          <p className="saved-empty">No hay salidas guardadas.</p>
        ) : (
          <ul className="saved-list">
            {savedRides.map(ride => (
              <li
                key={ride.id}
                className={`saved-item${ride.id === selectedRideId ? ' saved-item--selected' : ''}`}
                onClick={() => onSelectRide(ride.id)}
              >
                <div>
                  <p className="saved-item-title">{ride.name}</p>
                  <p className="saved-item-meta">
                    {ride.km.toFixed(2)} km · {ride.points} puntos
                  </p>
                </div>
                <button
                  className="saved-item-delete"
                  onClick={e => { e.stopPropagation(); onDeleteRide(ride.id); }}
                  aria-label={`Eliminar ${ride.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="saved-group">
        <p className="saved-group-title">Zonas a evitar ({savedAvoidZones.length})</p>
        {savedAvoidZones.length === 0 ? (
          <p className="saved-empty">No hay zonas guardadas.</p>
        ) : (
          <ul className="saved-list">
            {savedAvoidZones.map(zone => (
              <li
                key={zone.id}
                className={`saved-item${zone.id === selectedAvoidId ? ' saved-item--selected saved-item--selected-avoid' : ''}`}
                onClick={() => onSelectAvoidZone(zone.id)}
              >
                <div>
                  <p className="saved-item-title">{zone.name}</p>
                  <p className="saved-item-meta">{zone.points} puntos</p>
                </div>
                <button
                  className="saved-item-delete"
                  onClick={e => { e.stopPropagation(); onDeleteAvoidZone(zone.id); }}
                  aria-label={`Eliminar ${zone.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
