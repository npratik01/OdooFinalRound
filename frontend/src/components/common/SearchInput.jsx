import { useState, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import useDebounce from '../../hooks/useDebounce'

/**
 * SearchInput – a controlled search field with debounce built in.
 *
 * How it works:
 *  - Displays whatever the user types immediately (no lag in the UI).
 *  - Calls `onSearch(value)` only after the user stops typing for `debounceMs`
 *    ms, OR when the user presses Enter, OR when the search icon / button is
 *    clicked.
 *  - If `minLength` is set, the API call is skipped unless the typed value is
 *    empty (shows all) or reaches the minimum length.
 *
 * Props:
 *  @param {function} onSearch      - Called with the committed search string.
 *  @param {string}   placeholder   - Input placeholder text.
 *  @param {number}   debounceMs    - Debounce delay in ms (default 600).
 *  @param {number}   minLength     - Min chars before debounced fire (default 3).
 *                                     Empty string always fires.
 *  @param {string}   className     - Extra class for the wrapper div.
 *  @param {string}   inputClassName - Extra class for the <input>.
 *  @param {string}   id            - Optional id for the <input>.
 *  @param {string}   defaultValue  - Initial value (uncontrolled start).
 */
const SearchInput = ({
  onSearch,
  placeholder = 'Search...',
  debounceMs = 600,
  minLength = 3,
  className = '',
  inputClassName = '',
  id,
  defaultValue = '',
}) => {
  const [inputValue, setInputValue] = useState(defaultValue)
  // Keep a stable ref to the latest onSearch so we don't trigger re-debounces
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  // The debounced value – updates debounceMs after inputValue stops changing
  const debouncedValue = useDebounce(inputValue, debounceMs)

  // Fire search when the debounced value changes
  const prevDebouncedRef = useRef(debouncedValue)
  if (prevDebouncedRef.current !== debouncedValue) {
    prevDebouncedRef.current = debouncedValue
    const trimmed = debouncedValue.trim()
    // Fire only if empty (reset) or meets minLength requirement
    if (trimmed === '' || trimmed.length >= minLength) {
      onSearchRef.current(trimmed)
    }
  }

  // Handle Enter key – fires immediately without waiting for debounce
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const trimmed = inputValue.trim()
        if (trimmed === '' || trimmed.length >= minLength) {
          onSearchRef.current(trimmed)
        }
      }
    },
    [inputValue, minLength]
  )

  // Clear button
  const handleClear = useCallback(() => {
    setInputValue('')
    onSearchRef.current('')
  }, [])

  // Search icon click – fire immediately
  const handleSearchClick = useCallback(() => {
    const trimmed = inputValue.trim()
    if (trimmed === '' || trimmed.length >= minLength) {
      onSearchRef.current(trimmed)
    }
  }, [inputValue, minLength])

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Search icon (clickable) */}
      <button
        type="button"
        onClick={handleSearchClick}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary-400 transition-colors"
        tabIndex={-1}
        aria-label="Search"
      >
        <Search size={15} />
      </button>

      <input
        id={id}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={`
          w-full pl-9 pr-8 py-2
          bg-slate-800 border border-slate-700 rounded-xl
          text-sm text-slate-200 placeholder-slate-500
          focus:outline-none focus:border-primary-500
          transition-colors
          ${inputClassName}
        `}
      />

      {/* Clear button – only visible when there's text */}
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-400 transition-colors"
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}

export default SearchInput
