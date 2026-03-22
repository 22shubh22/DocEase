import { useState, useRef, useEffect, useCallback } from 'react';
import useDropdownFlip from '../../hooks/useDropdownFlip';

export default function CreatableComboBox({
  value,
  onChange,
  options = [],
  onCreateNew,
  placeholder = 'Type to search...',
  disabled = false,
  className = '',
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const flipUp = useDropdownFlip(containerRef, isOpen);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((opt) =>
    opt.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const exactMatch = options.some(
    (opt) => opt.name.toLowerCase() === inputValue.trim().toLowerCase()
  );

  const showUseOption = inputValue.trim() && !exactMatch;
  const showCreateOption = showUseOption && onCreateNew;

  // Total items in dropdown (filtered options + optional use/create items)
  const totalItems = filtered.length + (showUseOption ? 1 : 0) + (showCreateOption ? 1 : 0);

  const selectOption = useCallback(
    (opt) => {
      setInputValue(opt.name);
      onChange(opt.name, opt);
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onChange]
  );

  const handleCreateNew = useCallback(async () => {
    if (creating) return;
    const name = inputValue.trim();
    setCreating(true);
    try {
      const newOpt = await onCreateNew(name);
      if (newOpt) {
        setInputValue(newOpt.name || name);
        onChange(newOpt.name || name, newOpt);
      }
    } catch {
      // Caller handles error (e.g. toast)
    } finally {
      setCreating(false);
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }, [creating, inputValue, onCreateNew, onChange]);

  const commitFreeText = useCallback(() => {
    const name = inputValue.trim();
    if (name && name !== value) {
      setInputValue(name);
      onChange(name, null);
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }, [inputValue, value, onChange]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    setHighlightedIndex(-1);
    // If user clears the field, notify parent
    if (!val) {
      onChange('', null);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          selectOption(filtered[highlightedIndex]);
        } else if (showUseOption && highlightedIndex === filtered.length) {
          commitFreeText();
        } else if (showCreateOption && highlightedIndex === filtered.length + 1) {
          handleCreateNew();
        } else if (inputValue.trim()) {
          commitFreeText();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        // On tab, commit the typed value as free text
        if (inputValue.trim() && inputValue !== value) {
          onChange(inputValue.trim(), null);
        }
        break;
    }
  };

  const handleBlur = () => {
    // Small delay so click events on dropdown items fire first
    setTimeout(() => {
      if (
        containerRef.current &&
        !containerRef.current.contains(document.activeElement)
      ) {
        setIsOpen(false);
        // Commit typed value as free text on blur
        if (inputValue.trim() && inputValue !== value) {
          onChange(inputValue.trim(), null);
        }
      }
    }, 150);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        className="input text-sm"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        autoComplete="off"
      />

      {isOpen && totalItems > 0 && (
        <ul className={`absolute z-50 left-0 right-0 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm ${flipUp ? 'bottom-full mb-1' : 'mt-1'}`}>
          {filtered.map((opt, idx) => (
            <li
              key={opt.id}
              className={`px-3 py-2 cursor-pointer ${
                idx === highlightedIndex
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(opt);
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              {opt.name}
            </li>
          ))}

          {showUseOption && (
            <li
              className={`px-3 py-2 cursor-pointer border-t border-gray-100 text-gray-700 ${
                highlightedIndex === filtered.length
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                commitFreeText();
              }}
              onMouseEnter={() => setHighlightedIndex(filtered.length)}
            >
              Use &ldquo;{inputValue.trim()}&rdquo;
            </li>
          )}

          {showCreateOption && (
            <li
              className={`px-3 py-2 cursor-pointer border-t border-gray-100 text-primary-600 font-medium ${
                highlightedIndex === filtered.length + 1
                  ? 'bg-primary-50'
                  : 'hover:bg-gray-50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleCreateNew();
              }}
              onMouseEnter={() => setHighlightedIndex(filtered.length + 1)}
            >
              {creating ? (
                <span className="text-gray-400">Adding...</span>
              ) : (
                <>+ Add &ldquo;{inputValue.trim()}&rdquo; to master list</>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
