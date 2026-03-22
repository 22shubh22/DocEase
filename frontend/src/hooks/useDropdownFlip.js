import { useState, useEffect } from 'react';

export default function useDropdownFlip(containerRef, isOpen, threshold = 200) {
  const [flipUp, setFlipUp] = useState(false);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setFlipUp(spaceBelow < threshold && spaceAbove > spaceBelow);
    } else {
      setFlipUp(false);
    }
  }, [isOpen, containerRef, threshold]);

  return flipUp;
}
