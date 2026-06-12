import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../Selections.css';

function useFetch(url) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  useEffect(() => {
    if (!url) { setLoading(false); return; }
    setLoading(true); setError(null);
    fetch(url)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [url]);
  return { data, loading, error };
}

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

export default function DivisionView() {
  const { id } = useParams();

  const { data: division, loading: divLoading }  = useFetch(`/api/content/divisions/${id}`);
  const { data: subdivisions, loading: subLoading } = useFetch(`/api/content/divisions/${id}/subdivisions`);

  // Pick the first image referenced by any subdivision's selections
  const firstImageId = (subdivisions || [])
    .flatMap(s => s.selections || [])
    .find(sel => sel.image_id)?.image_id ?? null;

  const { data: imageData } = useFetch(firstImageId != null ? `/api/images/${firstImageId}` : null);

  if (divLoading || subLoading) return <div className="loading">Loading…</div>;
  if (!division) return <div className="failed">Division not found.</div>;

  const subs = subdivisions || [];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <h2 style={{ marginBottom: '0.25rem' }}>{division.label || `Division ${id}`}</h2>
      <div style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Type: {division.type} · {subs.length} subdivision{subs.length !== 1 ? 's' : ''}
      </div>

      {subs.length === 0 && (
        <div style={{ color: '#888', fontStyle: 'italic' }}>
          No subdivisions found for this division.
        </div>
      )}

      {subs.length > 0 && !imageData && (
        <div style={{ color: '#888', fontStyle: 'italic' }}>
          Subdivisions exist but no image selections are linked yet.
        </div>
      )}

      {subs.length > 0 && imageData && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Image with overlaid subdivision rectangles */}
          <div className="selectedImage" style={{ flex: '1 1 0', minWidth: 0 }}>
            <img
              className="selectedImageImage"
              src={`/api/images/${imageData.uri}`}
              alt={imageData.alt || division.label || ''}
            />
            {subs.map((sub, i) =>
              (sub.selections || [])
                .filter(sel => sel.image_id === firstImageId)
                .map((sel, j) => (
                  <div
                    key={`${i}-${j}`}
                    className="selection"
                    title={sub.label}
                    style={{
                      top:    `${sel.top    * 100}%`,
                      left:   `${sel.left   * 100}%`,
                      width:  `${sel.width  * 100}%`,
                      height: `${sel.height * 100}%`,
                      borderColor:  COLORS[i % COLORS.length],
                      outlineColor: 'rgba(0,0,0,0.35)',
                    }}
                  />
                ))
            )}
          </div>

          {/* Legend */}
          <div style={{ minWidth: 190, flexShrink: 0 }}>
            <div style={{
              fontWeight: 600, marginBottom: '0.6rem',
              fontSize: '0.8rem', textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#555',
            }}>
              Subdivisions
            </div>
            {subs.map((sub, i) => (
              <div key={sub.id} style={{
                display: 'flex', alignItems: 'center',
                gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem',
              }}>
                <span style={{
                  display: 'inline-block', width: 12, height: 12,
                  borderRadius: 2, background: COLORS[i % COLORS.length],
                  flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)',
                }} />
                <span>{sub.label || `Sub ${i + 1}`}</span>
                <span style={{ color: '#999', fontSize: '0.8rem', marginLeft: 'auto' }}>
                  {sub.start_char}–{sub.end_char}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
