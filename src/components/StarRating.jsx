import { useState } from 'react';

export default function StarRating({ value = 0, onChange, max = 5 }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="flex items-center gap-1">
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        return (
          <span
            key={starValue}
            className={`cursor-pointer text-2xl transition-colors ${
              starValue <= (hovered ?? value) 
                ? 'text-primary' 
                : 'text-background-dark'
            }`}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(null)}
            role="button"
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >★</span>
        );
      })}
    </div>
  );
} 