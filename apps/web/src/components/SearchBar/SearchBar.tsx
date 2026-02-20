import { useState } from 'react'
import './SearchBar.css'
import apiClient from '../../lib/apiClient'
import { type GeoResult } from '../../types'

interface Props {
  onSelect: (result: GeoResult) => void
  onLocate: () => void
}

export default function SearchBar({ onSelect, onLocate }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setSelectedId(null)
    try {
      const { data } = await apiClient.get<GeoResult[]>(
        `/geo/geocode?q=${encodeURIComponent(query.trim())}`,
      )
      if (data.length === 1) {
        handleSelect(data[0])
      } else {
        setResults(data)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(result: GeoResult) {
    onSelect(result)
    setQuery(result.display_name)
    setSelectedId(result.place_id)
  }

  return (
    <div className="search-bar">
      <div className="search-input-row">
        <input
          type="text"
          placeholder="Buscar ciudad o lugar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button onClick={search} disabled={loading} aria-label="Buscar">
          {loading ? '…' : '⌕'}
        </button>
        <button onClick={onLocate} aria-label="Centrar en mi ubicación" className="locate-btn">
          ◎
        </button>
      </div>

      {results.length > 0 && (
        <div className="search-results">
          <div className="search-results-header">
            <span className="search-results-count">{results.length} resultados</span>
            <button
              className="search-results-close"
              onClick={() => setResults([])}
              aria-label="Cerrar resultados"
            >
              ✕
            </button>
          </div>
          <ul>
            {results.map((result) => (
              <li
                key={result.place_id}
                className={result.place_id === selectedId ? 'selected' : ''}
                onClick={() => handleSelect(result)}
              >
                {result.display_name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
