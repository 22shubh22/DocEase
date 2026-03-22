import { useState, useRef, useEffect, useCallback } from 'react';

export default function MultiSelectComboBox({
  selected = [],
  onChange,
  options = [],
  onCreateNew,
  placeholder = 'Type to search...',
  chipColor = 'bg-blue-100 text-blue-800',
  disabled = false,
  className = '',
}) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

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

  // Filter options: exclude already-selected and match input
  const filtered = options.filter(
    (opt) =>
      !selected.includes(opt.name) &&
      opt.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const exactMatch = options.some(
    (opt) => opt.name.toLowerCase() === inputValue.trim().toLowerCase()
  );

  const alreadySelected = selected.some(
    (s) => s.toLowerCase() === inputValue.trim().toLowerCase()
  );

  const showUseOption = inputValue.trim() && !exactMatch && !alreadySelected;
  const showCreateOption = showUseOption && onCreateNew;

  const totalItems = filtered.length + (showUseOption ? 1 : 0) + (showCreateOption ? 1 : 0);

  const addItem = useCallback(
    (name) => {
      if (!selected.includes(name)) {
        onChange([...selected, name]);
      }
      setInputValue('');
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [selected, onChange]
  );

  const removeItem = useCallback(
    (index) => {
      onChange(selected.filter((_, i) => i !== index));
    },
    [selected, onChange]
  );

  const selectOption = useCallback(
    (opt) => {
      addItem(opt.name);
    },
    [addItem]
  );

  const handleCreateNew = useCallback(async () => {
    if (creating) return;
    const name = inputValue.trim();
    setCreating(true);
    try {
      const newOpt = await onCreateNew(name);
      if (newOpt) {
        addItem(newOpt.name || name);
      }
    } catch {
      // Caller handles error (e.g. toast)
    } finally {
      setCreating(false);
    }
  }, [creating, inputValue, onCreateNew, addItem]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const commitFreeText = () => {
    const text = inputValue.trim();
    if (text && !alreadySelected) {
      // Support comma-separated entries
      const items = text.split(',').map((s) => s.trim()).filter((s) => s);
      const newSelected = [...selected];
      items.forEach((item) => {
        if (!newSelected.some((s) => s.toLowerCase() === item.toLowerCase())) {
          newSelected.push(item);
        }
      });
      onChange(newSelected);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
      // Remove last chip on backspace when input is empty
      removeItem(selected.length - 1);
      return;
    }

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (!isOpen && e.key === 'Enter') {
      e.preventDefault();
      commitFreeText();
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
        } else {
          commitFreeText();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        if (inputValue.trim()) {
          commitFreeText();
        }
        break;
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (
        containerRef.current &&
        !containerRef.current.contains(document.activeElement)
      ) {
        setIsOpen(false);
        if (inputValue.trim()) {
          commitFreeText();
        }
      }
    }, 150);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Chips + Input in a single bordered container */}
      <div
        className="flex flex-wrap gap-1.5 items-center input min-h-[42px] cursor-text py-1.5 px-2"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((item, index) => (
          <span
            key={index}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${chipColor} rounded-full text-sm whitespace-nowrap`}
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeItem(index);
              }}
              className="hover:opacity-70 font-bold ml-0.5"
              disabled={disabled}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[120px] outline-none border-none bg-transparent text-sm p-0.5"
          placeholder={selected.length === 0 ? placeholder : 'Add more...'}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {isOpen && totalItems > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
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
