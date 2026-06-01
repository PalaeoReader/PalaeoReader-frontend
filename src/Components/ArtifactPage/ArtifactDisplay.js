import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

const LAYERS = [
  { key: 'script',        label: 'Script',       cls: 'layer-script',        isMorph: false },
  { key: 'translit',      label: 'Translit.',    cls: 'layer-translit',      isMorph: false },
  { key: 'transcription', label: 'Transcr.',     cls: 'layer-transcription', isMorph: false },
  { key: 'translation',   label: 'Transl.',      cls: 'layer-translation',   isMorph: false },
  { key: 'morph-transcr', label: 'Morph. form',  cls: 'layer-morph-transcr', isMorph: true  },
  { key: 'morph-gloss',   label: 'Morph. gloss', cls: 'layer-morph-gloss',   isMorph: true  },
];

// colors assigned to sources in discovery order
const COLOR_SLOTS = [
  { border: '#7F77DD', bg: '#EEEDFE', text: '#534AB7', row: 'rgba(127,119,221,0.05)' },
  { border: '#1D9E75', bg: '#E1F5EE', text: '#0F6E56', row: 'rgba(29,158,117,0.05)'  },
  { border: '#EF9F27', bg: '#FAEEDA', text: '#854F0B', row: 'rgba(239,159,39,0.05)'  },
];
const COMMUNITY_COLOR = { border: '#D85A30', bg: '#FAECE7', text: '#993C1D', row: 'rgba(216,90,48,0.05)' };

function contentTypeToLayer(type) {
  if (type === 'original') return 'script';
  if (type === 'transliteration' || type === 'tranliteration') return 'translit';
  if (type.startsWith('transcription')) return 'transcription';
  if (type.startsWith('translation') || type.startsWith('tranlation')) return 'translation';
  return null;
}

function srcLabel(src, id) {
  if (!src) return `Source ${id}`;
  const last = src.author.split(' ').pop();
  return src.date_published ? `${last} ${src.date_published}` : last;
}

function getTokens(set) {
  const bySeq = {};
  (set?.tokens || []).forEach(t => {
    if (!bySeq[t.seq] || t.type === 'original') bySeq[t.seq] = t;
  });
  return Object.values(bySeq).sort((a, b) => a.seq - b.seq);
}

// aligned morpheme + gloss — uses a table so every column is automatically
// sized to the wider of its form or gloss, keeping rows perfectly aligned
function MorphInterlinear({ morphs }) {
  if (!morphs || morphs.length === 0) return null;

  const byToken = {};
  morphs.forEach(m => {
    if (!byToken[m.token_seq]) byToken[m.token_seq] = {};
    if (!byToken[m.token_seq][m.seq]) byToken[m.token_seq][m.seq] = { form: '', gloss: '' };
    if (m.type.startsWith('morpheme')) byToken[m.token_seq][m.seq].form = m.text;
    if (m.type === 'gloss') byToken[m.token_seq][m.seq].gloss = m.text;
  });

  const tokenSeqs = [...new Set(morphs.map(m => m.token_seq))].sort((a, b) => a - b);

  const cells = [];
  tokenSeqs.forEach((tseq, ti) => {
    const pairs = byToken[tseq];
    Object.keys(pairs).sort((a, b) => Number(a) - Number(b)).forEach(seq => {
      cells.push({ form: pairs[seq].form || ' ', gloss: pairs[seq].gloss || ' ' });
    });
    // word separator between tokens
    if (ti < tokenSeqs.length - 1) cells.push({ sep: true });
  });

  if (cells.filter(c => !c.sep).length === 0) return null;

  return (
    <table className="morph-table">
      <tbody>
        <tr className="morph-form-row layer-morph-transcr">
          {cells.map((cell, i) =>
            cell.sep
              ? <td key={i} className="morph-sep-td" />
              : <td key={i} className="morph-form-td">{cell.form}</td>
          )}
        </tr>
        <tr className="morph-gloss-row layer-morph-gloss">
          {cells.map((cell, i) =>
            cell.sep
              ? <td key={i} className="morph-sep-td" />
              : <td key={i} className="morph-gloss-td">{cell.gloss}</td>
          )}
        </tr>
      </tbody>
    </table>
  );
}

// one row in stacked view: left border + badge + layer tag + text
function SourceRow({ text, layerCls, layerLabel, authorId, authorLabel, color, isNA }) {
  return (
    <div
      className={`stk-row ${layerCls} author-${authorId}`}
      style={{ borderLeft: `2px solid ${color.border}`, background: color.row }}
    >
      <span className="stk-badge" style={{ background: color.bg, color: color.text }}>
        {authorLabel}
      </span>
      <span className="stk-layer-tag">{layerLabel}</span>
      {isNA
        ? <span className="stk-na">not available <span className="stk-na-badge">NA</span></span>
        : <span className={`stk-text stk-text-${layerCls.replace('layer-', '')}`}>{text}</span>
      }
    </div>
  );
}

// inline contribution form
function ContributeForm({ onSubmit, onCancel }) {
  const [name, setName]   = useState('');
  const [layer, setLayer] = useState('translation');
  const [text, setText]   = useState('');

  const submit = () => {
    if (!text.trim()) { onCancel(); return; }
    onSubmit({ name: name.trim() || 'anonymous', layer, text: text.trim() });
    setName(''); setText('');
  };

  return (
    <div className="stk-form">
      <div className="stk-form-row">
        <input
          className="stk-form-input"
          placeholder="Your name or handle"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <select className="stk-form-select" value={layer} onChange={e => setLayer(e.target.value)}>
          <option value="transliteration">Transliteration</option>
          <option value="transcription">Transcription</option>
          <option value="translation">Translation</option>
        </select>
      </div>
      <textarea
        className="stk-form-textarea"
        placeholder="Your analysis for this omen..."
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
      />
      <div className="stk-form-actions">
        <button className="stk-form-submit" onClick={submit}>Submit</button>
        <button className="stk-form-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// compare omen block — grouped by layer, all authors under each layer
function StackedOmenBlock({ omenSeq, omenType, sets, sources, colorMap, contributions, onAddContribution }) {
  const [formOpen, setFormOpen] = useState(false);
  const label = omenType === 'omen' ? `Omen ${omenSeq}` : `Line ${omenSeq}`;

  const firstSet = sets[0];
  const morphs = firstSet?.morphs || [];
  const contribs = contributions[omenSeq] || [];

  // content layers only (not morph)
  const contentLayers = LAYERS.filter(l => !l.isMorph);

  const byLayer = {};
  contentLayers.forEach(l => { byLayer[l.key] = []; });
  sets.forEach(set => {
    const color = colorMap[String(set.source_id)] || COLOR_SLOTS[0];
    const src = sources[String(set.source_id)];
    const author = srcLabel(src, set.source_id);
    const contentByLayer = {};
    (set.contents || []).forEach(c => {
      const lk = contentTypeToLayer(c.type);
      if (lk && !contentByLayer[lk]) contentByLayer[lk] = c.text;
    });
    contentLayers.forEach(l => {
      byLayer[l.key].push({ sourceId: String(set.source_id), author, color, text: contentByLayer[l.key] || null });
    });
  });

  const contribsByLayer = {};
  contribs.forEach(c => {
    const lk = c.layer === 'transliteration' ? 'translit' : c.layer;
    if (!contribsByLayer[lk]) contribsByLayer[lk] = [];
    contribsByLayer[lk].push(c);
  });

  return (
    <div className="stk-omen" id={`omen-${omenSeq}`}>
      <div className="stk-omen-label">{label}</div>

      {contentLayers.map(l => {
        const rows = byLayer[l.key];
        const extraContribs = contribsByLayer[l.key] || [];
        return (
          <div key={l.key} className={`stk-layer-group ${l.cls}`}>
            <div className="stk-layer-group-header">{l.label}</div>
            {rows.map(r => (
              <div
                key={r.sourceId}
                className={`stk-row author-${r.sourceId}`}
                style={{ borderLeft: `2px solid ${r.color.border}`, background: r.color.row }}
              >
                <span className="stk-badge" style={{ background: r.color.bg, color: r.color.text }}>{r.author}</span>
                {r.text
                  ? <span className={`stk-text stk-text-${l.cls.replace('layer-', '')}`}>{r.text}</span>
                  : <span className="stk-na">not available <span className="stk-na-badge">NA</span></span>
                }
              </div>
            ))}
            {extraContribs.map((c, i) => (
              <div key={`contrib-${i}`} className="stk-row author-community"
                style={{ borderLeft: `2px solid ${COMMUNITY_COLOR.border}`, background: COMMUNITY_COLOR.row }}
              >
                <span className="stk-badge" style={{ background: COMMUNITY_COLOR.bg, color: COMMUNITY_COLOR.text }}>{c.name}</span>
                <span className={`stk-text stk-text-${l.cls.replace('layer-', '')}`}>{c.text}</span>
              </div>
            ))}
          </div>
        );
      })}

      {morphs.length > 0 && (
        <div className="stk-layer-group layer-morph-transcr layer-morph-gloss">
          <div className="stk-layer-group-header">Morphological analysis</div>
          <div className="stk-row" style={{ borderLeft: '2px solid #7F77DD', background: 'rgba(127,119,221,0.03)', paddingTop: '0.4rem', paddingBottom: '0.4rem' }}>
            <MorphInterlinear morphs={morphs} />
          </div>
        </div>
      )}

      {formOpen
        ? <ContributeForm
            onSubmit={d => { onAddContribution(omenSeq, d); setFormOpen(false); }}
            onCancel={() => setFormOpen(false)}
          />
        : <button className="stk-add-btn" onClick={() => setFormOpen(true)}>
            + add your analysis for this omen
          </button>
      }
    </div>
  );
}

// read mode omen block — one source at a time
function ReadOmenBlock({ set }) {
  const label = set.type === 'omen' ? `Omen ${set.seq}` : `Line ${set.seq}`;
  const byLayer = {};
  (set.contents || []).forEach(c => {
    const lk = contentTypeToLayer(c.type);
    if (lk && !byLayer[lk]) byLayer[lk] = c.text;
  });
  const morphs = set.morphs || [];

  return (
    <div className="v2-omen-block" id={`omen-${set.seq}`}>
      <div className="v2-omen-label">{label}</div>
      {LAYERS.filter(l => !l.isMorph).map(l => {
        const content = byLayer[l.key];
        return (
          <div key={l.key} className={`v2-layer-row ${l.cls}`}>
            <span className="v2-layer-row-label">{l.label}</span>
            {content
              ? <span className={`v2-layer-text v2-text-${l.key}`}>{content}</span>
              : <span className="v2-na">not available <span className="v2-na-badge">NA</span></span>
            }
          </div>
        );
      })}
      {morphs.length > 0 && (
        <div className="v2-layer-row layer-morph-transcr layer-morph-gloss">
          <span className="v2-layer-row-label">Morph.</span>
          <MorphInterlinear morphs={morphs} />
        </div>
      )}
    </div>
  );
}

// author filter pills (stacked mode)
function AuthorPills({ sourceIds, sources, hiddenAuthors, onToggle, colorMap }) {
  return (
    <div className="stk-filter-group">
      <span className="stk-filter-label">Authors</span>
      <div className="stk-pills">
        {sourceIds.map(id => {
          const src = sources[id];
          const color = colorMap[id] || COLOR_SLOTS[0];
          const visible = !hiddenAuthors.has(id);
          return (
            <button
              key={id}
              className={`stk-pill${visible ? ' active' : ''}`}
              style={visible ? { borderColor: color.border, background: color.bg, color: color.text } : {}}
              onClick={() => onToggle(id)}
              aria-pressed={visible}
            >
              {srcLabel(src, id)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// layer filter pills
function LayerPills({ hiddenLayers, onToggle }) {
  return (
    <div className="stk-filter-group">
      <span className="stk-filter-label">Layers</span>
      <div className="stk-pills">
        {LAYERS.map(l => {
          const visible = !hiddenLayers.has(l.key);
          return (
            <button
              key={l.key}
              className={`stk-pill${visible ? ' active' : ''}`}
              onClick={() => onToggle(l.key)}
              aria-pressed={visible}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// right panel — artifact metadata and sources only
function DetailsPanel({ artifact, sources, sourceIds }) {
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
      <div className="v2-meta-hint">Click any word chip to see its morphological breakdown.</div>
    </div>
  );
}

// left panel — manuscript images
function ManuscriptPanel({ artifact }) {
  const [activeImg, setActiveImg] = useState(null);
  const [bw, setBw] = useState(false);
  const { data: groups } = useFetch(`/api/artifacts/${artifact.shortname}/image_groups`);
  const allImgs = Array.isArray(groups) ? groups.flatMap(g => g.images || []) : [];
  const currentImg = activeImg || (allImgs[0]?.uri ? `/api/images/${allImgs[0].uri}` : null);

  return (
    <div className="v2-manuscript-panel">
      <div className="v2-panel-header">Manuscript</div>
      {currentImg
        ? <img className="v2-manuscript-img" src={currentImg} alt={artifact.label}
            style={{ filter: bw ? 'grayscale(1) contrast(1.1)' : 'none' }}
            onError={e => { e.target.style.display = 'none'; }} />
        : <div className="v2-img-placeholder">No image available</div>
      }
      {allImgs.length > 1 && (
        <div className="v2-thumb-strip">
          {allImgs.map(img => (
            <img key={img.id}
              className={`v2-thumb${currentImg === `/api/images/${img.uri}` ? ' active' : ''}`}
              src={`/api/images/${img.uri}`} alt=""
              onClick={() => setActiveImg(`/api/images/${img.uri}`)}
              onError={e => { e.target.style.display = 'none'; }} />
          ))}
        </div>
      )}
      <div className="v2-img-controls">
        <button className={`v2-ctrl-btn${bw ? ' active' : ''}`} onClick={() => setBw(v => !v)}>B&amp;W</button>
        {currentImg && <a className="v2-ctrl-btn" href={currentImg} target="_blank" rel="noreferrer">Full size</a>}
      </div>
    </div>
  );
}

export default function ArtifactDisplay() {
  const { shortName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: allArtifacts } = useFetch('/api/artifacts/');
  const artifact = Array.isArray(allArtifacts) ? allArtifacts.find(a => a.shortname === shortName) || null : null;

  const { data: allSets } = useFetch(artifact ? `/api/artifacts/${artifact.id}/sets` : null);
  const sets = Array.isArray(allSets) ? allSets : [];
  const sourceIds = [...new Set(sets.map(s => String(s.source_id)))];

  const [sources, setSources] = useState({});
  useEffect(() => {
    sourceIds.forEach(id => {
      if (sources[id]) return;
      fetch(`/api/sources/${id}`).then(r => r.json()).then(src => setSources(p => ({ ...p, [id]: src }))).catch(() => {});
    });
  }, [sourceIds.join(',')]);

  // assign a color to each source in discovery order
  const colorMap = {};
  sourceIds.forEach((id, i) => { colorMap[id] = COLOR_SLOTS[i % COLOR_SLOTS.length]; });

  // mode: 'read' or 'stacked'
  const [mode, setMode] = useState(() => searchParams.get('mode') || 'read');

  // read mode: which source tab is active
  const [activeSource, setActiveSource] = useState(null);
  useEffect(() => {
    if (sourceIds.length > 0 && !activeSource) setActiveSource(sourceIds[0]);
  }, [sourceIds.join(',')]);

  // stacked mode filters
  const [hiddenAuthors, setHiddenAuthors] = useState(() => {
    const p = searchParams.get('hidden_authors');
    return p ? new Set(p.split(',')) : new Set();
  });
  const [hiddenLayers, setHiddenLayers] = useState(() => {
    const p = searchParams.get('hidden_layers');
    return p ? new Set(p.split(',')) : new Set();
  });

  // sync url
  useEffect(() => {
    const p = { mode };
    if (hiddenAuthors.size) p.hidden_authors = [...hiddenAuthors].join(',');
    if (hiddenLayers.size)  p.hidden_layers  = [...hiddenLayers].join(',');
    setSearchParams(p, { replace: true });
  }, [mode, hiddenAuthors, hiddenLayers]);

  const [contributions, setContributions] = useState({});

  const toggleAuthor = useCallback(id => {
    setHiddenAuthors(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const toggleLayer = useCallback(key => {
    setHiddenLayers(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  const addContribution = useCallback((omenSeq, data) => {
    setContributions(prev => ({ ...prev, [omenSeq]: [...(prev[omenSeq] || []), data] }));
  }, []);

  if (!artifact) return <div className="loading-wrap">Loading…</div>;

  const omenSeqs = [...new Set(sets.map(s => s.seq))].sort((a, b) => a - b);

  // read mode: sets for the active source
  const readSets = sets.filter(s => String(s.source_id) === String(activeSource)).sort((a, b) => a.seq - b.seq);

  // stacked mode: css hide classes on the wrapper
  const hideClasses = [
    ...[...hiddenAuthors].map(id => `hide-author-${id}`),
    ...[...hiddenLayers].map(k => `hide-layer-${k}`),
  ].join(' ');

  return (
    <div className="v2-viewer-layout">
      <ManuscriptPanel artifact={artifact} />

      <div className="v2-center-panel">
        <div className="v2-controls-bar">
          {/* mode toggle */}
          <div className="v2-controls-row">
            <div className="v2-mode-selector">
              <button className={`v2-mode-btn${mode === 'read'    ? ' active' : ''}`} onClick={() => setMode('read')}>Read</button>
              <button className={`v2-mode-btn${mode === 'stacked' ? ' active' : ''}`} onClick={() => setMode('stacked')}>Compare</button>
            </div>
          </div>

          {/* read mode: source pills */}
          {mode === 'read' && (
            <div className="v2-controls-row">
              <div className="v2-source-pills">
                {sourceIds.map(id => (
                  <button
                    key={id}
                    className={`v2-source-pill${String(activeSource) === id ? ' active' : ''}`}
                    onClick={() => setActiveSource(id)}
                  >
                    {srcLabel(sources[id], id)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* stacked mode: author + layer filters */}
          {mode === 'stacked' && (
            <>
              <div className="v2-controls-row">
                <AuthorPills sourceIds={sourceIds} sources={sources} hiddenAuthors={hiddenAuthors} onToggle={toggleAuthor} colorMap={colorMap} />
              </div>
              <div className="v2-controls-row">
                <LayerPills hiddenLayers={hiddenLayers} onToggle={toggleLayer} />
              </div>
            </>
          )}
        </div>

        <div className={`v2-text-display ${mode === 'stacked' ? hideClasses : ''}`}>
          {mode === 'read'
            ? readSets.length > 0
              ? readSets.map(s => (
                  <ReadOmenBlock key={s.id} set={s} />
                ))
              : <div className="v2-empty">Select a source above to read the text.</div>
            : omenSeqs.map(seq => {
                const seqSets = sets
                  .filter(s => s.seq === seq)
                  .sort((a, b) => sourceIds.indexOf(String(a.source_id)) - sourceIds.indexOf(String(b.source_id)));
                return (
                  <StackedOmenBlock
                    key={seq}
                    omenSeq={seq}
                    omenType={seqSets[0]?.type || 'omen'}
                    sets={seqSets}
                    sources={sources}
                    colorMap={colorMap}
                    contributions={contributions}
                    onAddContribution={addContribution}
                  />
                );
              })
          }

          {sourceIds.length > 0 && (
            <div className="v2-references">
              <div className="v2-references-title">References</div>
              {sourceIds.map(id => {
                const src = sources[id];
                if (!src) return null;
                return (
                  <div key={id} className="v2-reference-entry">
                    <span className="v2-ref-author">{src.author}</span>
                    {src.date_published && <span className="v2-ref-date"> ({src.date_published}). </span>}
                    {src.title && <span className="v2-ref-title">{src.title}.</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <DetailsPanel artifact={artifact} sources={sources} sourceIds={sourceIds} />
    </div>
  );
}
