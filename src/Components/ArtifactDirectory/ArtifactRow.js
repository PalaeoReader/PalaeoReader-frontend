import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../config';

function useData(url) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setError(null);
    fetch(url)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [url]);

  return { data, loading, error };
}

const RUNES = '𐰚 𐰇 𐰀 𐰼 𐰢 𐰤 𐰏 𐰉 𐰆 𐰕 𐰴 𐰣 𐱅 𐰾 𐰃 𐰋 𐰓 𐰞 𐰺 𐱁 𐰭 𐰘 𐰲 𐰿 𐰍 𐱃 𐰙 𐰑 𐰯 𐰱'.split(' ');

function ArtifactCard({ artifact }) {
  const coverUri = artifact.cover_image?.uri
    ? apiUrl(`/api/images/${artifact.cover_image.uri}`)
    : null;
  const tags = [
    artifact.script?.split(',')[0]?.trim(),
    artifact.material?.split(',')[0]?.trim(),
  ].filter(Boolean);
  const meta = [artifact.origin_date, artifact.location?.name].filter(Boolean).join(' · ');

  return (
    <a href={`/artifact/${artifact.shortname}`} className="hp-artifact-card">
      <div className="hp-artifact-img-area">
        {coverUri
          ? <img src={coverUri} alt={artifact.label} className="hp-artifact-img"
              onError={e => { e.target.style.display = 'none'; }} />
          : null}
        <div className="hp-artifact-img-runes" aria-hidden="true">
          {RUNES.slice(0, 40).map((r, i) => <span key={i}>{r} </span>)}
        </div>
      </div>
      <div className="hp-artifact-body">
        <div className="hp-artifact-name">{artifact.label}</div>
        {meta && <div className="hp-artifact-meta">{meta}</div>}
        {artifact.language && <div className="hp-artifact-language">{artifact.language}</div>}
        <div className="hp-artifact-tags">
          {tags.map(t => <span key={t} className="hp-tag">{t}</span>)}
        </div>
      </div>
    </a>
  );
}

function FilterGroup({ label, options, selected, onSelect }) {
  const counts = {};
  options.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const unique = [...new Set(options)].filter(Boolean).sort();
  return (
    <div>
      <div className="sidebar-section-title">{label}</div>
      <div
        className={`sidebar-filter-option${!selected ? ' active' : ''}`}
        onClick={() => onSelect('')}
      >
        <span>All</span>
        <span className="sidebar-filter-count">{options.length}</span>
      </div>
      {unique.map(v => (
        <div
          key={v}
          className={`sidebar-filter-option${selected === v ? ' active' : ''}`}
          onClick={() => onSelect(selected === v ? '' : v)}
        >
          <span>{v}</span>
          <span className="sidebar-filter-count">{counts[v]}</span>
        </div>
      ))}
    </div>
  );
}

export const ArtifactRow = () => {
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [script, setScript]     = useState('');
  const [material, setMaterial] = useState('');
  const [listView, setListView] = useState(false);
  const timerRef = useRef(null);

  const { data, loading, error } = useData(apiUrl('/api/artifacts/'));

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(timerRef.current);
  }, [search]);

  if (loading) return <div className="loading-wrap">Loading artifacts…</div>;
  if (error)   return (
    <div className="error-wrap">
      Could not reach the server.
      <br /><small>{error}</small>
    </div>
  );
  if (!data)   return null;

  const q = debouncedSearch.toLowerCase();
  const filtered = data.filter(a => {
    const ms = !q ||
      (a.label || '').toLowerCase().includes(q) ||
      (a.language || '').toLowerCase().includes(q) ||
      (a.script || '').toLowerCase().includes(q) ||
      (a.description || '').replace(/<[^>]+>/g, '').toLowerCase().includes(q);
    return ms
      && (!script   || (a.script   || '').split(',')[0]?.trim() === script)
      && (!material || (a.material || '').split(',')[0]?.trim() === material);
  });

  const allScripts   = data.map(a => a.script?.split(',')[0]?.trim()).filter(Boolean);
  const allMaterials = data.map(a => a.material?.split(',')[0]?.trim()).filter(Boolean);

  return (
    <div className="browse-layout">
      {/* ── Sidebar ── */}
      <div className="browse-sidebar">
        <div className="sidebar-section-title" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>Search</div>
        <input
          className="sidebar-input"
          placeholder="Name, language, script…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <p className="sidebar-results-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>

        <FilterGroup
          label="Script"
          options={allScripts}
          selected={script}
          onSelect={setScript}
        />
        <FilterGroup
          label="Material"
          options={allMaterials}
          selected={material}
          onSelect={setMaterial}
        />
      </div>

      {/* ── Main content ── */}
      <div className="browse-main">
        <div className="browse-main-header">
          <div>
            <div className="browse-main-title">Artifact Directory</div>
            <div className="browse-main-count">
              {filtered.length} of {data.length} artifact{data.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={() => setListView(v => !v)}
            style={{ background: 'none', border: '0.5px solid var(--border-strong)', borderRadius: 2, padding: '4px 10px', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            {listView ? 'Grid' : 'List'}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">No artifacts match your search criteria.</div>
        ) : listView ? (
          <div className="browse-list">
            {filtered.map(a => {
              const coverUri = a.cover_image?.uri ? apiUrl(`/api/images/${a.cover_image.uri}`) : null;
              const tags = [a.script?.split(',')[0]?.trim(), a.material?.split(',')[0]?.trim()].filter(Boolean);
              return (
                <a key={a.id} href={`/artifact/${a.shortname}`} className="browse-list-row">
                  <div className="browse-list-thumb">
                    {coverUri
                      ? <img src={coverUri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>𐰚</span>}
                  </div>
                  <div className="browse-list-body">
                    <div className="browse-list-name">{a.label}</div>
                    <div className="browse-list-meta">{[a.origin_date, a.language].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div className="browse-list-tags">
                    {tags.map(t => <span key={t} className="hp-tag">{t}</span>)}
                  </div>
                  <i className="ti ti-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14, flexShrink: 0 }} />
                </a>
              );
            })}
          </div>
        ) : (
          <div className="hp-artifact-grid">
            {filtered.map(a => <ArtifactCard key={a.id} artifact={a} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtifactRow;
