import React from 'react';

// A small removable filter chip (the Authors/Language/Layer rows in the
// toolbar). Pass `dotColor` to show a colored bullet before the content.
export default function Pill({ dotColor, onRemove, children }) {
  return (
    <span className="mtb-pill" style={dotColor ? { borderColor: dotColor } : undefined}>
      {dotColor && <span className="mtb-dot" style={{ color: dotColor }}>●</span>}
      {children}
      <button className="mtb-pill-x" onClick={onRemove}>✕</button>
    </span>
  );
}
