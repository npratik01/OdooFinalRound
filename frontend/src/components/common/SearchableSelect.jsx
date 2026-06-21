import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, Check, X, Loader2 } from 'lucide-react'

export default function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  onSearchChange,
  placeholder = 'Select...',
  isLoading = false,
  required = false,
  error = '',
  containerClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)
  const listRef = useRef(null)

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value)

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1)
      setLocalSearch('')
      if (onSearchChange) onSearchChange('')
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 50)
    }
  }, [isOpen])

  // Scroll active option into view when using keyboard
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex]
      if (activeEl) {
        activeEl.scrollIntoView({
          block: 'nearest',
        })
      }
    }
  }, [highlightedIndex])

  const handleSearchChange = (e) => {
    const term = e.target.value
    setLocalSearch(term)
    setHighlightedIndex(-1)
    if (onSearchChange) {
      onSearchChange(term)
    }
  }

  const selectOption = (opt) => {
    onChange(opt.value)
    setIsOpen(false)
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          selectOption(options[highlightedIndex])
        } else if (options.length === 1) {
          selectOption(options[0])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      case 'Tab':
        setIsOpen(false)
        break
      default:
        break
    }
  }

  return (
    <div className={`w-full relative ${containerClassName}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-slate-900 border text-slate-100 text-left rounded-xl px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <span className={selectedOption ? 'text-slate-200' : 'text-slate-500'}>
          {selectedOption
            ? selectedOption.sublabel
              ? `${selectedOption.label} (${selectedOption.sublabel})`
              : selectedOption.label
            : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Inner Search Box */}
          <div className="p-2 border-b border-slate-800 flex items-center gap-2 bg-slate-950/40">
            <Search size={14} className="text-slate-500 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={localSearch}
              onChange={handleSearchChange}
              className="w-full bg-transparent border-none text-slate-200 text-sm focus:outline-none placeholder:text-slate-600"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('')
                  if (onSearchChange) onSearchChange('')
                  if (searchInputRef.current) searchInputRef.current.focus()
                }}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-500">
                <Loader2 size={12} className="animate-spin text-primary-400" />
                Searching database...
              </div>
            ) : options.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                No matching results found
              </div>
            ) : (
              options.map((opt, idx) => {
                const isSelected = opt.value === value
                const isHighlighted = idx === highlightedIndex

                return (
                  <div
                    key={opt.value}
                    onClick={() => selectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between text-sm transition-colors duration-150 ${
                      isSelected
                        ? 'bg-primary-500/10 text-primary-400 font-medium'
                        : isHighlighted
                        ? 'bg-slate-800 text-slate-200'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-slate-200">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{opt.sublabel}</span>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-primary-400 shrink-0 ml-2" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
