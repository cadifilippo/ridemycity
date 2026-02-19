import { useState } from 'react'
import './SearchBar.css'

export interface GeoResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface Props {
  onSelect: (result: GeoResult) => void
  onLocate: () => void
}

const API_BASE = 'http://localhost:3000'

export default function SearchBar({ onSelect, onLocate }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE}/geo/geocode?q=${encodeURIComponent(query.trim())}`,
      )
      const data: GeoResult[] = await res.json()
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
    setResults([])
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
        <ul className="search-results">
          {results.map((result) => (
            <li key={result.place_id} onClick={() => handleSelect(result)}>
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
