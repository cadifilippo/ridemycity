import { Route, MapPinned, Activity } from 'lucide-react';
import { type Stats } from '../../types';

interface Props {
  stats: Stats;
}

export default function StatsPanel({ stats }: Props) {
  return (
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
  );
}
