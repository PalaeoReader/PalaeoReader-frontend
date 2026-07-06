import React from 'react';

// A small icon-only button (clock/pencil/pin/etc). Always stops the click from
// bubbling up to the row it sits in, since these buttons live inside clickable
// hover rows across the artifact viewer.
export default function IconButton({ className, icon, onClick }) {
  return (
    <button className={className} onClick={e => { e.stopPropagation(); onClick(e); }}>
      <i className={`fas ${icon}`} />
    </button>
  );
}
