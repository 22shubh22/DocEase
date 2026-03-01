import { useState, useRef, useEffect, useCallback } from 'react';
import { patientsAPI } from '../../services/api';

export default function SearchablePatientSelect({ patients = [], value, onChange, required }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  // Find the selected patient object for display
  const selectedPatient = value
    ? [...patients, ...results].find(p => p.id === value)
    : null;

  // Display list: search results when query exists, otherwise preloaded patients
  const displayList = query.trim() ? results : patients;

  // Search patients with debounce
  const searchPatients = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await patientsAPI.search(q);
        setResults(response.data?.patients || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setHighlightIndex(-1);
    setIsOpen(true);
    searchPatients(val);
  };

  // Select a patient
  const handleSelect = (patient) => {
    onChange(patient.id);
    setQuery('');
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  // Clear selection
  const handleClear = () => {
    onChange('');
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(i => Math.min(i + 1, displayList.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < displayList.length) {
          handleSelect(displayList[highlightIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex];
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // If a patient is selected, show it as a chip with clear button
  if (selectedPatient) {
    return (
      <div className="relative">
        <div className="input flex items-center justify-between gap-2">
          <span className="truncate">
            {selectedPatient.patient_code} - {selectedPatient.full_name}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none"
          >
            &times;
          </button>
        </div>
        {/* Hidden input for form validation */}
        {required && <input type="hidden" value={value} required />}
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className="input"
        placeholder="Search by name or patient code..."
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {/* Hidden input for form required validation */}
      {required && <input type="hidden" value={value || ''} required />}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {searching && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          )}

          {!searching && displayList.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              {query.trim() ? 'No patients found' : 'No patients available'}
            </div>
          )}

          {!searching && displayList.length > 0 && (
            <ul ref={listRef} role="listbox">
              {displayList.map((patient, index) => (
                <li
                  key={patient.id}
                  role="option"
                  aria-selected={index === highlightIndex}
                  className={`px-4 py-2 cursor-pointer text-sm ${
                    index === highlightIndex
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(patient);
                  }}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  <span className="font-medium">{patient.patient_code}</span>
                  <span className="text-gray-400 mx-1">-</span>
                  {patient.full_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
