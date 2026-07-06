import React from 'react';

// A "+" button that opens a dropdown of togglable items (the Authors/Language/
// Layer "add back" menus in the toolbar). `openId` is the currently-open
// popover's id, owned by the parent; this only renders open when it matches `id`.
export default function AddPopover({ id, openId, onToggle, items }) {
  const isOpen = openId === id;
  return (
    <div className="mtb-add-wrap">
      <button
        className={`mtb-add-btn${isOpen ? ' mtb-open' : ''}`}
        onClick={() => onToggle(id)}
      >
        +
      </button>
      {isOpen && (
        <div className="mtb-popover">
          {items.map(item => (
            <div
              key={item.key}
              className={`mtb-pop-row${item.selected ? ' mtb-selected' : ''}`}
              onClick={item.onClick}
            >
              {item.dotColor && <span className="mtb-dot" style={{ color: item.dotColor }}>●</span>}
              <span className="mtb-pop-label">{item.label}</span>
              {item.selected && <i className="fas fa-check mtb-check" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
