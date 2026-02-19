import { Trash2 } from 'lucide-react';

interface Props {
  savedRides: Array<{ id: string; name: string; km: number; points: number }>;
  savedAvoidZones: Array<{ id: string; name: string; points: number }>;
  onDeleteRide: (id: string) => void;
  onDeleteAvoidZone: (id: string) => void;
}

export default function SavedList({
  savedRides,
  savedAvoidZones,
  onDeleteRide,
  onDeleteAvoidZone,
}: Props) {
  return (
    <div className="sidebar-saved">
      <p className="stats-heading">Guardados</p>

      <div className="saved-group">
        <p className="saved-group-title">Rutas ({savedRides.length})</p>
        {savedRides.length === 0 ? (
          <p className="saved-empty">No hay rutas guardadas.</p>
        ) : (
          <ul className="saved-list">
            {savedRides.map(ride => (
              <li key={ride.id} className="saved-item">
                <div>
                  <p className="saved-item-title">{ride.name}</p>
                  <p className="saved-item-meta">
                    {ride.km.toFixed(2)} km · {ride.points} puntos
                  </p>
                </div>
                <button
                  className="saved-item-delete"
                  onClick={() => onDeleteRide(ride.id)}
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
              <li key={zone.id} className="saved-item">
                <div>
                  <p className="saved-item-title">{zone.name}</p>
                  <p className="saved-item-meta">{zone.points} puntos</p>
                </div>
                <button
                  className="saved-item-delete"
                  onClick={() => onDeleteAvoidZone(zone.id)}
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
