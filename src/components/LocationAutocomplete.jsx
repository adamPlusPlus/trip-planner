import { useState, useEffect, useRef } from 'react'

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const DEBOUNCE_MS = 300
const MIN_LENGTH = 2
const MAX_RESULTS = 8

function formatSuggestion(r) {
  const parts = [r.name]
  if (r.admin1 && r.admin1 !== r.name) parts.push(r.admin1)
  if (r.country) parts.push(r.country)
  return parts.join(', ')
}

/**
 * Location input with autocomplete (city, state, country) via Open-Meteo Geocoding.
 * @param {string} value - Controlled input value
 * @param {(value: string) => void} onChange - When text or selection changes
 * @param {({ location: string, coords: { lat: number, lon: number } }) => void} [onSelect] - When user picks a suggestion (location string + coords)
 * @param {string} [placeholder]
 * @param {string} [className]
 * @param {string} [id]
 */
export default function LocationAutocomplete({ value, onChange, onSelect, placeholder = 'City, state or country', className = '', id }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const q = (value || '').trim()
    if (q.length < MIN_LENGTH) {
      setSuggestions([])
      setOpen(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      fetch(`${GEOCODE_URL}?name=${encodeURIComponent(q)}&count=${MAX_RESULTS}&language=en`)
        .then((res) => res.json())
        .then((data) => {
          const list = data.results || []
          setSuggestions(list)
          setOpen(list.length > 0)
          setActiveIndex(-1)
        })
        .catch(() => {
          setSuggestions([])
          setOpen(false)
        })
        .finally(() => setLoading(false))
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (r) => {
    const location = formatSuggestion(r)
    onChange(location)
    onSelect?.({ location, coords: { lat: r.latitude, lon: r.longitude } })
    setOpen(false)
    setSuggestions([])
  }

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Escape') setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
      return
    }
    if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="location-listbox"
        aria-activedescendant={activeIndex >= 0 ? `location-opt-${activeIndex}` : undefined}
      />
      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <span className="inline-block w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul
          id="location-listbox"
          role="listbox"
          className="absolute z-20 w-full mt-1 py-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto"
        >
          {suggestions.map((r, idx) => {
            const label = formatSuggestion(r)
            return (
              <li
                key={`${r.id ?? idx}-${r.latitude}-${r.longitude}`}
                id={`location-opt-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => handleSelect(r)}
                className={`px-3 py-2 text-sm cursor-pointer ${idx === activeIndex ? 'bg-primary-50 text-primary-900' : 'text-gray-800 hover:bg-gray-50'}`}
              >
                {label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
