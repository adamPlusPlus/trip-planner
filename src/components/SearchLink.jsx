// Renders a search link (label + query). Opens DuckDuckGo or in-app results when backend is used.

export default function SearchLink({ label, query, className = '' }) {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-primary-600 hover:underline ${className}`}
    >
      {label || query}
    </a>
  )
}
