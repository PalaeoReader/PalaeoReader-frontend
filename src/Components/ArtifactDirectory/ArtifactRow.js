import React, { useState, useEffect } from 'react';

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

export const ArtifactRow = () => {
  const [search, setSearch]     = useState('');
  const [script, setScript]     = useState('');
  const [material, setMaterial] = useState('');

  const { data, loading, error } = useData('/api/artifacts/');

  if (loading) return <div className="loading-wrap">Loading artifacts…</div>;
  if (error)   return (
    <div className="error-wrap">
      Could not reach the server. Make sure the backend is running on port 8000.
      <br/><small>{error}</small>
    </div>
  );
  if (!data)   return null;

  const scripts   = [...new Set(data.map(a => a.script).filter(Boolean))];
  const materials = [...new Set(data.map(a => a.material).filter(Boolean))];

  const filtered = data.filter(a => {
    const q = search.toLowerCase();
    const ms = !q ||
      (a.label || '').toLowerCase().includes(q) ||
      (a.language || '').toLowerCase().includes(q) ||
      (a.script || '').toLowerCase().includes(q) ||
      (a.description || '').replace(/<[^>]+>/g, '').toLowerCase().includes(q);
    return ms && (!script || a.script === script) && (!material || a.material === material);
  });

  return (
    <div className="browse-layout">
      <div className="browse-sidebar">
        <div className="sidebar-section-title">Search</div>
        <input
          className="sidebar-input"
          placeholder="Name, language, script…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <p className="sidebar-results-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>

        <div className="sidebar-section-title">Script</div>
        <select className="sidebar-select" value={script} onChange={e => setScript(e.target.value)}>
          <option value="">All scripts</option>
          {scripts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="sidebar-section-title">Material</div>
        <select className="sidebar-select" value={material} onChange={e => setMaterial(e.target.value)}>
          <option value="">All materials</option>
          {materials.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="browse-main">
        <div className="browse-main-header">
          <div className="browse-main-title">Artifact Directory</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {filtered.length} of {data.length} artifact{data.length !== 1 ? 's' : ''}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">No artifacts match your search criteria.</div>
        ) : (
          <table className="artifact-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Title</th>
                <th style={{ width: '13%' }}>Date</th>
                <th style={{ width: '22%' }}>Script</th>
                <th style={{ width: '15%' }}>Material</th>
                <th style={{ width: '20%' }}>Language</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const desc = (a.description || '').replace(/<[^>]+>/g, '').slice(0, 110);
                return (
                  <tr key={a.id}>
                    <td>
                      <a className="artifact-table-title" href={`/artifact/${a.shortname}`}>{a.label}</a>
                      {desc && <div className="artifact-table-desc">{desc}{desc.length === 110 ? '…' : ''}</div>}
                    </td>
                    <td>{a.origin_date && <span className="tag tag-date">{a.origin_date}</span>}</td>
                    <td>{a.script && <span className="tag tag-script">{a.script.split(',')[0].trim()}</span>}</td>
                    <td>{a.material && <span className="tag tag-material">{a.material.split(',')[0].trim()}</span>}</td>
                    <td>{a.language && <span className="tag tag-language">{a.language.split(',')[0].trim()}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ArtifactRow;
