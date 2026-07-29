import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config';

function useFetch(url) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!url) return;
    fetch(url).then(r => r.json()).then(setData).catch(() => {});
  }, [url]);
  return data;
}

function contentTypeToLayer(type) {
  if (type === 'original') return 'script';
  if (type === 'transliteration' || type === 'tranliteration') return 'translit';
  if (type.startsWith('transcription')) return 'transcription';
  if (type.startsWith('translation') || type.startsWith('tranlation')) return 'translation';
  return null;
}

// wraps the matched keyword in a <mark> tag inline
function Highlighted({ text, query }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="conc-mark">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function ConcordancePage() {
  const [query, setQuery]       = useState('');
  const [debounced, setDebounced] = useState('');

  // data
  const allArtifacts = useFetch(apiUrl('/api/artifacts/')) || [];
  const [setsMap, setSetsMap]       = useState({}); // artifactId -> sets
  const [sourcesMap, setSourcesMap] = useState({}); // sourceId -> source

  // filters
  const [filterTexts,   setFilterTexts]   = useState(null); // null = all
  const [filterSources, setFilterSources] = useState(null);
  const [filterLayers,  setFilterLayers]  = useState(new Set(['translit', 'translation']));

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 150);
    return () => clearTimeout(t);
  }, [query]);

  // load sets for each artifact
  useEffect(() => {
    allArtifacts.forEach(a => {
      if (setsMap[a.id]) return;
      fetch(apiUrl(`/api/artifacts/${a.id}/sets`))
        .then(r => r.json())
        .then(sets => {
          setSetsMap(prev => ({ ...prev, [a.id]: sets }));
          [...new Set(sets.map(s => s.source_id))].forEach(sid => {
            if (sourcesMap[sid]) return;
            fetch(apiUrl(`/api/sources/${sid}`)).then(r => r.json())
              .then(src => setSourcesMap(prev => ({ ...prev, [sid]: src })))
              .catch(() => {});
          });
        })
        .catch(() => {});
    });
  }, [allArtifacts.map(a => a.id).join(',')]);

  // initialize text filter once artifacts load
  useEffect(() => {
    if (allArtifacts.length && !filterTexts) {
      setFilterTexts(new Set(allArtifacts.map(a => String(a.id))));
    }
  }, [allArtifacts.length]);

  const toggleSet = (setter, val) => {
    setter(prev => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  };

  // collect all source IDs across all loaded sets
  const allSourceIds = [...new Set(Object.values(setsMap).flat().map(s => String(s.source_id)))];

  // search
  const results = [];
  if (debounced.length >= 2) {
    const q = debounced.toLowerCase();
    allArtifacts.forEach(a => {
      if (filterTexts && !filterTexts.has(String(a.id))) return;
      const sets = setsMap[a.id] || [];
      sets.forEach(set => {
        if (filterSources && !filterSources.has(String(set.source_id))) return;
        (set.contents || []).forEach(c => {
          const lk = contentTypeToLayer(c.type);
          if (!lk || !filterLayers.has(lk)) return;
          if (!c.text.toLowerCase().includes(q)) return;
          results.push({ a, set, sourceId: String(set.source_id), layerKey: lk, text: c.text });
        });
      });
    });
  }

  // group by artifact + source
  const grouped = {};
  results.forEach(r => {
    const key = `${r.a.id}__${r.sourceId}`;
    if (!grouped[key]) grouped[key] = { artifact: r.a, sourceId: r.sourceId, rows: [] };
    grouped[key].rows.push(r);
  });
  const groupKeys = Object.keys(grouped);

  const layerOptions = [
    { key: 'translit',      label: 'Transliteration' },
    { key: 'transcription', label: 'Transcription'   },
    { key: 'translation',   label: 'Translation'     },
  ];

  return (
    <div className="conc-wrap">
      <div className="conc-header">
        <h1 className="conc-title">Concordance</h1>
        <p className="conc-subtitle">Search any word or morpheme across all texts and sources</p>
      </div>

      <div className="conc-search-bar">
        <input
          className="conc-input"
          placeholder="Search a word or morpheme…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="conc-filters">
        <div className="conc-filter-group">
          <span className="conc-filter-label">Text</span>
          {allArtifacts.map(a => (
            <button
              key={a.id}
              className={`conc-pill${filterTexts?.has(String(a.id)) ? ' active' : ''}`}
              onClick={() => toggleSet(setFilterTexts, String(a.id))}
              aria-pressed={!!filterTexts?.has(String(a.id))}
            >
              {a.label}
            </button>
          ))}
        </div>

        {allSourceIds.length > 0 && (
          <div className="conc-filter-group">
            <span className="conc-filter-label">Source</span>
            {allSourceIds.map(id => {
              const src = sourcesMap[id];
              const label = src ? `${src.author.split(' ').pop()}${src.date_published ? ' ' + src.date_published : ''}` : `Source ${id}`;
              const active = !filterSources || filterSources.has(id);
              return (
                <button
                  key={id}
                  className={`conc-pill${active ? ' active' : ''}`}
                  onClick={() => {
                    if (!filterSources) {
                      // first click: exclude this one
                      setFilterSources(new Set(allSourceIds.filter(s => s !== id)));
                    } else {
                      toggleSet(setFilterSources, id);
                    }
                  }}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div className="conc-filter-group">
          <span className="conc-filter-label">Layer</span>
          {layerOptions.map(l => (
            <button
              key={l.key}
              className={`conc-pill${filterLayers.has(l.key) ? ' active' : ''}`}
              onClick={() => toggleSet(setFilterLayers, l.key)}
              aria-pressed={filterLayers.has(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {debounced.length >= 2 && (
        <div className="conc-results-summary">
          <span className="conc-query">"{debounced}"</span>
          {' — '}
          <span>{results.length} occurrence{results.length !== 1 ? 's' : ''} · {groupKeys.length} source{groupKeys.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {debounced.length >= 2 && groupKeys.length === 0 && (
        <div className="conc-empty">
          No occurrences of "{debounced}" found. Try adjusting the filters or searching a related form.
        </div>
      )}

      <div className="conc-results">
        {groupKeys.map(key => {
          const g = grouped[key];
          const src = sourcesMap[g.sourceId];
          const srcName = src ? `${src.author}${src.date_published ? ', ' + src.date_published : ''}` : `Source ${g.sourceId}`;
          return (
            <div key={key} className="conc-group">
              <div className="conc-group-header">
                {g.artifact.label} · {srcName}
              </div>
              {g.rows.map((r, i) => {
                const loc = r.set.type === 'omen' ? `Omen ${r.set.seq}` : `Line ${r.set.seq}`;
                return (
                  <div key={i} className="conc-row">
                    <span className="conc-loc">{loc}</span>
                    <span className="conc-layer-tag">{r.layerKey}</span>
                    <span className={`conc-text conc-text-${r.layerKey}`}>
                      <Highlighted text={r.text} query={debounced} />
                    </span>
                    <a className="conc-view" href={`/artifact/${r.a.shortname}`}>view →</a>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
