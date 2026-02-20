import { X, Undo2, Save } from 'lucide-react';
import './DrawingPanel.css';
import { type DrawingMode } from '../../types';

interface Props {
  drawingMode: Exclude<DrawingMode, null>;
  estimatedKm: number;
  onStopDrawing: () => void;
  onUndo: () => void;
  onSave: () => void;
}

export default function DrawingPanel({ drawingMode, estimatedKm, onStopDrawing, onUndo, onSave }: Props) {
  return (
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
  );
}
