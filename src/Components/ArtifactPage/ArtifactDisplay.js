import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

function useFetch(url) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
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

const useSWR = (url) => useFetch(url);

/* ── Layer config ──────────────────────────────────────────── */
const LAYERS = [
  { key: 'script',        label: 'Script',        color: '#A89CDB', cls: 'layer-script'        },
  { key: 'translit',      label: 'Translit',       color: '#7DC4A8', cls: 'layer-translit'      },
  { key: 'transcription', label: 'Transcription',  color: '#D4A96A', cls: 'layer-transcription' },
  { key: 'translation',   label: 'Translation',    color: '#D47A6A', cls: 'layer-translation'   },
];

function contentTypeToLayer(type) {
  if (type === 'original')                                               return 'script';
  if (type === 'transliteration' || type === 'tranliteration')          return 'translit';
  if (type.startsWith('transcription'))                                  return 'transcription';
  if (type.startsWith('translation') || type.startsWith('tranlation'))  return 'translation';
  return null;
}

/* ── Mode selector ─────────────────────────────────────────── */
function ModeSelector({ mode, onChange }) {
  return (
    <div className="v2-mode-selector">
      <button className={`v2-mode-btn${mode === 'read'    ? ' active' : ''}`} onClick={() => onChange('read')}>Read</button>
      <button className={`v2-mode-btn${mode === 'compare' ? ' active' : ''}`} onClick={() => onChange('compare')}>Compare sources</button>
    </div>
  );
}

/* ── Source pills ──────────────────────────────────────────── */
function sourceLabel(src, id) {
  if (!src) return `Source ${id}`;
  const year = src.date_published ? ` ${src.date_published}` : '';
  const lastName = src.author ? src.author.split(' ').slice(-1)[0] : `Source ${id}`;
  return `${lastName}${year}`;
}

function SourcePills({ sourceIds, sources, activeSource, onSelect, multi, selected, onToggle }) {
  return (
    <div className="v2-source-pills">
      {sourceIds.map(id => {
        const src = sources[id];
        const label = sourceLabel(src, id);
        const isActive = multi ? selected.includes(id) : String(activeSource) === String(id);
        return (
          <button
            key={id}
            className={`v2-source-pill${isActive ? ' active' : ''}`}
            onClick={() => multi ? onToggle(id) : onSelect(id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Layer toggles ─────────────────────────────────────────── */
function LayerToggles({ hiddenLayers, onToggle }) {
  return (
    <div className="v2-layer-toggles">
      {LAYERS.map(l => {
        const on = !hiddenLayers.has(l.key);
        return (
          <button
            key={l.key}
            className={`v2-layer-btn${on ? ' on' : ' off'}`}
            style={{ '--layer-color': l.color }}
            onClick={() => onToggle(l.key)}
            aria-pressed={on}
          >
            <span className="v2-layer-dot" />
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Omen block (Read mode) ────────────────────────────────── */
function OmenBlock({ set, onWordClick, selectedWord }) {
  const byLayer = {};
  (set.contents || []).forEach(c => {
    const layer = contentTypeToLayer(c.type);
    if (layer && !byLayer[layer]) byLayer[layer] = c;
  });

  const tokBySeq = {};
  (set.tokens || []).forEach(t => {
    if (!tokBySeq[t.seq] || t.type === 'original') tokBySeq[t.seq] = t;
  });
  const displayTokens = Object.values(tokBySeq).sort((a, b) => a.seq - b.seq);

  return (
    <div className="v2-omen-block">
      <div className="v2-omen-label">{set.type === 'omen' ? `Omen ${set.seq}` : `Line ${set.seq}`}</div>

      {LAYERS.map(l => {
        const content = byLayer[l.key];
        return (
          <div key={l.key} className={`v2-layer-row ${l.cls}`}>
            <span className="v2-layer-row-label" style={{ color: l.color }}>{l.label}</span>
            {content
              ? <span className={`v2-layer-text v2-text-${l.key}`}>{content.text}</span>
              : <span className="v2-na">not available <span className="v2-na-badge">NA</span></span>
            }
          </div>
        );
      })}

      {displayTokens.length > 0 && (
        <div className="v2-word-chips">
          {displayTokens.map(tok => {
            const isActive = selectedWord?.token.id === tok.id;
            const morphs = set.morphs || [];
            return (
              <button
                key={tok.id}
                className={`v2-word-chip${isActive ? ' active' : ''}`}
                onClick={() => onWordClick(tok, morphs, set.seq, set.type)}
                aria-pressed={isActive}
              >
                {tok.text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Compare block (one omen, multiple sources side by side) ── */
function CompareOmenBlock({ omenSeq, omenType, setsBySource, sources, selectedSources }) {
  return (
    <div className="v2-omen-block">
      <div className="v2-omen-label">{omenType === 'omen' ? `Omen ${omenSeq}` : `Line ${omenSeq}`}</div>
      <div
        className="v2-compare-grid"
        style={{ gridTemplateColumns: `repeat(${selectedSources.length}, 1fr)` }}
      >
        {selectedSources.map(srcId => {
          const set = setsBySource[srcId];
          const src = sources[srcId];
          const byLayer = {};
          (set?.contents || []).forEach(c => {
            const layer = contentTypeToLayer(c.type);
            if (layer && !byLayer[layer]) byLayer[layer] = c;
          });
          return (
            <div key={srcId} className="v2-compare-col">
              <div className="v2-compare-col-header">{src ? src.author : `Source ${srcId}`}</div>
              {LAYERS.map(l => {
                const content = byLayer[l.key];
                return (
                  <div key={l.key} className={`v2-layer-row ${l.cls}`}>
                    <span className="v2-layer-row-label" style={{ color: l.color, fontSize: '8px' }}>{l.label}</span>
                    {content
                      ? <span className={`v2-layer-text v2-text-${l.key}`}>{content.text}</span>
                      : <span className="v2-na" style={{ fontSize: '0.75rem' }}>NA</span>
                    }
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

/* ── Right panel ───────────────────────────────────────────── */
function DetailsPanel({ artifact, sources, sourceIds, selectedWord, onWordClose }) {
  if (selectedWord) {
    const { token, morphs, setSeq, setType } = selectedWord;
    const tokenMorphs = (morphs || []).filter(m => m.token_seq === token.seq);
    const label = setType === 'omen' ? `Omen ${setSeq}` : `Line ${setSeq}`;

    return (
      <div className="v2-details-panel">
        <button className="v2-detail-close" onClick={onWordClose}>✕ close</button>
        <div className="v2-word-detail-text">{token.text}</div>
        <div className="v2-word-detail-meta">
          <span>{token.type}</span>
          <span>{label}, word {token.seq}</span>
        </div>

        {tokenMorphs.length > 0 ? (
          <div className="v2-morphemes">
            <div className="v2-morphemes-label">Morphemes ({tokenMorphs.length})</div>
            <div className="v2-morpheme-chips">
              {tokenMorphs.map((m, i) => (
                <div key={i} className="v2-morpheme-chip-wrap">
                  <span className="v2-morpheme-chip">{m.text}</span>
                  <span className="v2-morpheme-type">{m.type}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="v2-no-morphs">No morpheme data for this word.</div>
        )}
      </div>
    );
  }

  return (
    <div className="v2-details-panel">
      <div className="v2-meta-section">
        <div className="v2-meta-header">Artifact Details</div>
        {[
          ['Script',     artifact.script],
          ['Language',   artifact.language],
          ['Date',       artifact.origin_date],
          ['Material',   artifact.material],
          ['Dimensions', artifact.dimensions],
          ['Discovered', artifact.discovery_date],
        ].filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="v2-meta-row">
            <span className="v2-meta-key">{k}</span>
            <span className="v2-meta-val">{v}</span>
          </div>
        ))}
      </div>

      <div className="v2-meta-divider" />

      <div className="v2-meta-section">
        <div className="v2-meta-header">Sources</div>
        {sourceIds.map(id => {
          const src = sources[id];
          if (!src) return null;
          return (
            <div key={id} className="v2-source-item">
              <div className="v2-source-item-author">{src.author}{src.date_published ? `, ${src.date_published}` : ''}</div>
              {src.title && <div className="v2-source-item-title">{src.title}</div>}
            </div>
          );
        })}
      </div>

      <div className="v2-meta-hint">Click any word in the chips row to see its morphological breakdown.</div>
    </div>
  );
}

/* ── Left panel ────────────────────────────────────────────── */
function ManuscriptPanel({ artifact }) {
  const [activeImg, setActiveImg] = useState(null);
  const [bw, setBw]               = useState(false);

  const { data: groups } = useSWR(
    `/api/artifacts/${artifact.shortname}/image_groups`);

  const allImgs    = Array.isArray(groups) ? groups.flatMap(g => g.images || []) : [];
  const currentImg = activeImg || (allImgs[0]?.uri ? `/api/images/${allImgs[0].uri}` : null);

  return (
    <div className="v2-manuscript-panel">
      <div className="v2-panel-header">Manuscript</div>

      {currentImg ? (
        <img
          className="v2-manuscript-img"
          src={currentImg}
          alt={artifact.label}
          style={{ filter: bw ? 'grayscale(1) contrast(1.1)' : 'none' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="v2-img-placeholder">No image available</div>
      )}

      {allImgs.length > 1 && (
        <div className="v2-thumb-strip">
          {allImgs.map(img => (
            <img
              key={img.id}
              className={`v2-thumb${currentImg === `/api/images/${img.uri}` ? ' active' : ''}`}
              src={`/api/images/${img.uri}`}
              alt=""
              onClick={() => setActiveImg(`/api/images/${img.uri}`)}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ))}
        </div>
      )}

      <div className="v2-img-controls">
        <button className={`v2-ctrl-btn${bw ? ' active' : ''}`} onClick={() => setBw(v => !v)}>
          B&amp;W
        </button>
        {currentImg && (
          <a className="v2-ctrl-btn" href={currentImg} target="_blank" rel="noreferrer">
            Full size
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────── */
export default function ArtifactDisplay() {
  const { shortName } = useParams();

  // Backend only supports lookup by numeric ID, not shortname.
  // Fetch the full list and find by shortname.
  const { data: allArtifacts } = useFetch('/api/artifacts/');
  const artifact = Array.isArray(allArtifacts)
    ? allArtifacts.find(a => a.shortname === shortName) || null
    : null;
  const error = !allArtifacts && !artifact ? null : null;

  const { data: allSets } = useSWR(
    artifact ? `/api/artifacts/${artifact.id}/sets` : null);

  const sets      = Array.isArray(allSets) ? allSets : [];
  const sourceIds = [...new Set(sets.map(s => String(s.source_id)))];

  /* fetch source metadata */
  const [sources, setSources] = useState({});
  useEffect(() => {
    sourceIds.forEach(id => {
      if (sources[id]) return;
      fetch(`/api/sources/${id}`)
        .then(r => r.json())
        .then(src => setSources(prev => ({ ...prev, [id]: src })))
        .catch(() => {});
    });
  }, [sourceIds.join(',')]);

  /* UI state */
  const [mode,           setMode]           = useState('read');
  const [activeSource,   setActiveSource]   = useState(null);
  const [compareSources, setCompareSources] = useState([]);
  const [hiddenLayers,   setHiddenLayers]   = useState(new Set());
  const [selectedWord,   setSelectedWord]   = useState(null);

  /* default source */
  useEffect(() => {
    if (sourceIds.length > 0 && !activeSource) {
      setActiveSource(sourceIds[0]);
      setCompareSources(sourceIds);
    }
  }, [sourceIds.join(',')]);

  const toggleLayer = useCallback(key => {
    setHiddenLayers(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const toggleCompareSource = useCallback(id => {
    setCompareSources(prev =>
      prev.includes(id) && prev.length === 1
        ? prev
        : prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  const handleWordClick = useCallback((token, morphs, setSeq, setType) => {
    setSelectedWord(prev =>
      prev?.token.id === token.id ? null : { token, morphs, setSeq, setType }
    );
  }, []);

  if (error)    return <div className="error-wrap">Failed to load artifact.</div>;
  if (!artifact) return <div className="loading-wrap">Loading…</div>;

  /* sets for current source (read mode) */
  const readSets = sets
    .filter(s => String(s.source_id) === String(activeSource))
    .sort((a, b) => a.seq - b.seq);

  /* unique omen seqs for compare mode */
  const omenSeqs = [...new Set(sets.map(s => s.seq))].sort((a, b) => a - b);

  /* CSS hide classes */
  const hideClasses = [...hiddenLayers].map(k => `hide-${k}`).join(' ');

  return (
    <div className="v2-viewer-layout">

      {/* LEFT — manuscript */}
      <ManuscriptPanel artifact={artifact} />

      {/* CENTER — analysis */}
      <div className="v2-center-panel">
        <div className="v2-controls-bar">
          <div className="v2-controls-row">
            <ModeSelector mode={mode} onChange={setMode} />
          </div>
          <div className="v2-controls-row">
            <SourcePills
              sourceIds={sourceIds}
              sources={sources}
              activeSource={activeSource}
              onSelect={setActiveSource}
              multi={mode === 'compare'}
              selected={compareSources}
              onToggle={toggleCompareSource}
            />
          </div>
          <div className="v2-controls-row">
            <LayerToggles hiddenLayers={hiddenLayers} onToggle={toggleLayer} />
          </div>
        </div>

        <div className={`v2-text-display ${hideClasses}`}>
          {mode === 'read' ? (
            readSets.length > 0
              ? readSets.map(s => (
                  <OmenBlock
                    key={s.id}
                    set={s}
                    onWordClick={handleWordClick}
                    selectedWord={selectedWord}
                  />
                ))
              : <div className="v2-empty">Select a source above to read the text.</div>
          ) : (
            omenSeqs.map(seq => {
              const first = sets.find(s => s.seq === seq);
              const setsBySource = {};
              compareSources.forEach(srcId => {
                const found = sets.find(s => String(s.source_id) === String(srcId) && s.seq === seq);
                if (found) setsBySource[srcId] = found;
              });
              return (
                <CompareOmenBlock
                  key={seq}
                  omenSeq={seq}
                  omenType={first?.type || 'omen'}
                  setsBySource={setsBySource}
                  sources={sources}
                  selectedSources={compareSources}
                />
              );
            })
          )}

          {/* References */}
          {sourceIds.length > 0 && (
            <div className="v2-references">
              <div className="v2-references-title">References</div>
              {sourceIds.map(id => {
                const src = sources[id];
                if (!src) return null;
                return (
                  <div key={id} className="v2-reference-entry">
                    <span className="v2-ref-author">{src.author}</span>
                    {src.date_published && (
                      <span className="v2-ref-date"> ({src.date_published}). </span>
                    )}
                    {src.title && (
                      <span className="v2-ref-title">{src.title}.</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — details / word */}
      <DetailsPanel
        artifact={artifact}
        sources={sources}
        sourceIds={sourceIds}
        selectedWord={selectedWord}
        onWordClose={() => setSelectedWord(null)}
      />

    </div>
  );
}
