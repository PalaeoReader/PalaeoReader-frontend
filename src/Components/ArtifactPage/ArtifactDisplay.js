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

const COLOR_SLOTS = [
  { border: '#7F77DD', bg: '#EEEDFE', text: '#534AB7', row: 'rgba(127,119,221,0.05)' },
  { border: '#1D9E75', bg: '#E1F5EE', text: '#0F6E56', row: 'rgba(29,158,117,0.05)'  },
  { border: '#EF9F27', bg: '#FAEEDA', text: '#854F0B', row: 'rgba(239,159,39,0.05)'  },
  { border: '#C75CA8', bg: '#F9EAFC', text: '#82346E', row: 'rgba(199,92,168,0.05)'  },
  { border: '#3A8FD6', bg: '#E3F1FB', text: '#1A5E99', row: 'rgba(58,143,214,0.05)'  },
  { border: '#D85A30', bg: '#FAECE7', text: '#993C1D', row: 'rgba(216,90,48,0.05)'   },
  { border: '#5B8A3C', bg: '#EAF4E3', text: '#2E5A18', row: 'rgba(91,138,60,0.05)'   },
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
    if (ti < tokenSeqs.length - 1) cells.push({ sep: true });
  });

  if (cells.filter(c => !c.sep).length === 0) return null;

  return (
    <div className="morph-flex">
      {cells.map((cell, i) =>
        cell.sep
          ? <span key={i} className="morph-sep" />
          : (
            <span key={i} className="morph-unit">
              <span className="morph-form layer-morph-transcr">{cell.form}</span>
              <span className="morph-gloss layer-morph-gloss">{cell.gloss}</span>
            </span>
          )
      )}
    </div>
  );
}

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
        <input className="stk-form-input" placeholder="Your name or handle" value={name} onChange={e => setName(e.target.value)} />
        <select className="stk-form-select" value={layer} onChange={e => setLayer(e.target.value)}>
          <option value="transliteration">Transliteration</option>
          <option value="transcription">Transcription</option>
          <option value="translation">Translation</option>
        </select>
      </div>
      <textarea className="stk-form-textarea" placeholder="Your analysis for this omen..." value={text} onChange={e => setText(e.target.value)} rows={2} />
      <div className="stk-form-actions">
        <button className="stk-form-submit" onClick={submit}>Submit</button>
        <button className="stk-form-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// Unified omen block — supports entry-layer-author and entry-author-layer grouping modes.
function OmenBlock({ omenSeq, omenType, sets, sources, colorMap, contributions, onAddContribution, grouping }) {
  const [formOpen, setFormOpen] = useState(false);
  const label = omenType === 'omen' ? `Omen ${omenSeq}` : `Line ${omenSeq}`;
  const firstSet = sets[0];
  const morphs = firstSet?.morphs || [];
  const contribs = contributions[omenSeq] || [];
  const contentLayers = LAYERS.filter(l => !l.isMorph);

  // Build both structures up front
  const byLayer = {};
  contentLayers.forEach(l => { byLayer[l.key] = []; });
  const bySrc = {};
  sets.forEach(set => {
    const color = colorMap[String(set.source_id)] || COLOR_SLOTS[0];
    const contentByLayer = {};
    (set.contents || []).forEach(c => {
      const lk = contentTypeToLayer(c.type);
      if (lk && !contentByLayer[lk]) contentByLayer[lk] = c.text;
    });
    contentLayers.forEach(l => {
      byLayer[l.key].push({ sourceId: String(set.source_id), color, text: contentByLayer[l.key] || null });
    });
    bySrc[String(set.source_id)] = { color, contentByLayer };
  });

  const contribsByLayer = {};
  contribs.forEach(c => {
    const lk = c.layer === 'transliteration' ? 'translit' : c.layer;
    if (!contribsByLayer[lk]) contribsByLayer[lk] = [];
    contribsByLayer[lk].push(c);
  });

  return (
    <div className="v2-omen-block" id={`omen-${omenSeq}`}>
      <div className="v2-omen-label">{label}</div>

      {grouping !== 'entry-author-layer' ? (
        /* ── Entry → Layer → Author ── */
        <>
          {contentLayers.map(l => {
            const activeRows = byLayer[l.key].filter(r => r.text);
            const extraContribs = contribsByLayer[l.key] || [];
            if (activeRows.length === 0 && extraContribs.length === 0) return null;
            return (
              <div key={l.key} className={`v2-layer-row-group ${l.cls}`}>
                <span className="v2-layer-row-label">{l.label}</span>
                <div className="v2-layer-authors">
                  {activeRows.map(r => (
                    <div key={r.sourceId} className={`author-line author-${r.sourceId}`}
                      style={{ borderLeft: `2px solid ${r.color.border}`, background: r.color.row }}>
                      <span className="author-dot" style={{ color: r.color.border }}>●</span>
                      <span className={`v2-layer-text v2-text-${l.key}`}>{r.text}</span>
                    </div>
                  ))}
                  {extraContribs.map((c, i) => (
                    <div key={`c-${i}`} className="author-line author-community"
                      style={{ borderLeft: `2px solid ${COMMUNITY_COLOR.border}`, background: COMMUNITY_COLOR.row }}>
                      <span className="author-dot" style={{ color: COMMUNITY_COLOR.border }}>●</span>
                      <span className={`v2-layer-text v2-text-${l.key}`}>{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {morphs.length > 0 && (() => {
            const morphColor = colorMap[String(firstSet?.source_id)] || COLOR_SLOTS[0];
            return (
              <div className="v2-layer-row-group layer-morph-transcr layer-morph-gloss">
                <span className="v2-layer-row-label">Morph.</span>
                <div className="v2-layer-authors">
                  <div className={`author-line author-morph author-${firstSet?.source_id}`}
                    style={{ borderLeft: `2px solid ${morphColor.border}`, background: morphColor.row, alignItems: 'flex-start' }}>
                    <span className="author-dot" style={{ color: morphColor.border, paddingTop: '0.2rem' }}>●</span>
                    <MorphInterlinear morphs={morphs} />
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      ) : (
        /* ── Group by Author ── */
        sets.map(set => {
          const srcId = String(set.source_id);
          const { color, contentByLayer } = bySrc[srcId];
          const author = srcLabel(sources[srcId], srcId);
          const isMorphAuthor = srcId === String(firstSet?.source_id);
          return (
            <div key={srcId} className={`author-block author-${srcId}`}
              style={{ borderColor: `${color.border}40` }}>
              <div className="author-block-header"
                style={{ borderLeft: `3px solid ${color.border}`, background: color.bg }}>
                <span className="author-block-name" style={{ color: color.text }}>{author}</span>
              </div>
              {contentLayers.map(l => {
                const text = contentByLayer[l.key] || null;
                if (!text) return null;
                return (
                  <div key={l.key} className={`v2-layer-row-group author-block-row ${l.cls}`}>
                    <span className="v2-layer-row-label">{l.label}</span>
                    <span className={`v2-layer-text v2-text-${l.key}`}>{text}</span>
                  </div>
                );
              })}
              {isMorphAuthor && morphs.length > 0 && (
                <div className="v2-layer-row-group author-block-row layer-morph-transcr layer-morph-gloss">
                  <span className="v2-layer-row-label">Morph.</span>
                  <MorphInterlinear morphs={morphs} />
                </div>
              )}
            </div>
          );
        })
      )}

      {formOpen
        ? <ContributeForm onSubmit={d => { onAddContribution(omenSeq, d); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        : <button className="stk-add-btn" onClick={() => setFormOpen(true)}>+ add your analysis for this omen</button>
      }
    </div>
  );
}

// All supported grouping modes
const GROUPING_MODES = {
  'author-layer':       ['author', 'layer',  null],
  'author-entry-layer': ['author', 'entry',  'layer'],
  'entry-layer-author': ['entry',  'layer',  'author'],
  'entry-author-layer': ['entry',  'author', 'layer'],
  'layer-entry-author': ['layer',  'entry',  'author'],
  'layer-author-entry': ['layer',  'author', 'entry'],
};
const GROUPING_LABELS = { author: 'Author', entry: 'Entry', layer: 'Layer' };
const SECOND_OPTS = { author: ['layer','entry'], entry: ['layer','author'], layer: ['entry','author'] };

function resolveMode(first, second) {
  const twoKey = `${first}-${second}`;
  if (GROUPING_MODES[twoKey]) return twoKey;
  const third = ['author','entry','layer'].find(x => x !== first && x !== second);
  const key = `${first}-${second}-${third}`;
  return GROUPING_MODES[key] ? key : 'entry-layer-author';
}

// Two-level hierarchical grouping control
function GroupingControl({ grouping, onChange }) {
  const [first, second] = GROUPING_MODES[grouping] || ['entry','layer','author'];
  const secondOpts = SECOND_OPTS[first];

  const setFirst = v => {
    const newOpts = SECOND_OPTS[v];
    const newSecond = newOpts.includes(second) ? second : newOpts[0];
    onChange(resolveMode(v, newSecond));
  };
  const setSecond = v => onChange(resolveMode(first, v));

  const badge = {
    'author-layer':       'Author → Layer',
    'author-entry-layer': 'Author → Entry → Layer',
    'entry-layer-author': 'Entry → Layer → Author',
    'entry-author-layer': 'Entry → Author → Layer',
    'layer-entry-author': 'Layer → Entry → Author',
    'layer-author-entry': 'Layer → Author → Entry',
  }[grouping];

  const third = GROUPING_MODES[grouping]?.[2];

  return (
    <div className="grouping-ctrl-wrap">
      <div className="grouping-ctrl-row">
        <span className="grouping-ctrl-label">Group by</span>
        <div className="seg-ctrl">
          {['author','entry','layer'].map(v => (
            <button key={v} className={`seg-btn${first === v ? ' active' : ''}`} onClick={() => setFirst(v)}>
              {GROUPING_LABELS[v]}
            </button>
          ))}
        </div>
        <span className="grouping-then">→ then</span>
        <div className="seg-ctrl">
          {secondOpts.map(v => (
            <button key={v} className={`seg-btn${second === v ? ' active' : ''}`} onClick={() => setSecond(v)}>
              {GROUPING_LABELS[v]}
            </button>
          ))}
        </div>
        {third && <span className="grouping-static">→ {GROUPING_LABELS[third]}</span>}
      </div>
      <div className="grouping-badge">{badge}</div>
    </div>
  );
}

// Layer → Entry → Author  or  Layer → Author → Entry
function LayerFirstView({ grouping, sets, sources, sourceIds, colorMap }) {
  const contentLayers = LAYERS.filter(l => !l.isMorph);
  const omenSeqs = [...new Set(sets.map(s => s.seq))].sort((a, b) => a - b);

  return contentLayers.map(layer => {
    const layerKey = layer.key;
    const getText = set => (set.contents || []).find(c => contentTypeToLayer(c.type) === layerKey)?.text || null;

    if (grouping === 'layer-entry-author') {
      // Layer → Entry → Author: for each layer, entries in order, authors stacked within
      const hasAny = omenSeqs.some(seq =>
        sets.filter(s => s.seq === seq).some(s => getText(s))
      );
      if (!hasAny) return null;
      return (
        <div key={layerKey} className={`layer-section ${layer.cls}`}>
          <div className="layer-section-header">{layer.label}</div>
          {omenSeqs.map(seq => {
            const seqSets = sets.filter(s => s.seq === seq)
              .sort((a, b) => sourceIds.indexOf(String(a.source_id)) - sourceIds.indexOf(String(b.source_id)));
            const rows = seqSets.map(s => ({ sourceId: String(s.source_id), color: colorMap[String(s.source_id)] || COLOR_SLOTS[0], text: getText(s) })).filter(r => r.text);
            if (!rows.length) return null;
            const entryLabel = seqSets[0]?.type === 'omen' ? `Omen ${seq}` : `Line ${seq}`;
            return (
              <div key={seq} className="layer-section-entry">
                <div className="layer-section-entry-label">{entryLabel}</div>
                {rows.map(r => (
                  <div key={r.sourceId} className={`author-line author-${r.sourceId}`}
                    style={{ borderLeft: `2px solid ${r.color.border}`, background: r.color.row }}>
                    <span className="author-dot" style={{ color: r.color.border }}>●</span>
                    <span className={`v2-layer-text v2-text-${layerKey}`}>{r.text}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    } else {
      // layer-author-entry: Layer → Author → Entry
      const hasAny = sourceIds.some(srcId => sets.filter(s => String(s.source_id) === srcId).some(s => getText(s)));
      if (!hasAny) return null;
      return (
        <div key={layerKey} className={`layer-section ${layer.cls}`}>
          <div className="layer-section-header">{layer.label}</div>
          {sourceIds.map(srcId => {
            const color = colorMap[srcId] || COLOR_SLOTS[0];
            const authorSets = sets.filter(s => String(s.source_id) === srcId).sort((a, b) => a.seq - b.seq);
            const entries = authorSets.map(s => ({ seq: s.seq, type: s.type, text: getText(s) })).filter(e => e.text);
            if (!entries.length) return null;
            return (
              <div key={srcId} className={`author-block author-${srcId}`} style={{ borderColor: `${color.border}40` }}>
                <div className="author-block-header" style={{ borderLeft: `3px solid ${color.border}`, background: color.bg }}>
                  <span className="author-block-name" style={{ color: color.text }}>{srcLabel(sources[srcId], srcId)}</span>
                </div>
                {entries.map(e => (
                  <div key={e.seq} className="v2-layer-row-group author-block-row">
                    <span className="v2-layer-row-label">{e.type === 'omen' ? `Omen ${e.seq}` : `Line ${e.seq}`}</span>
                    <span className={`v2-layer-text v2-text-${layerKey}`}>{e.text}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    }
  });
}

// Author → Layer view: one section per author
// grouping='author-layer'      → Author → Layer (all entries shown flat under each layer)
// grouping='author-entry-layer'→ Author → Entry → Layer (per-entry sub-sections)
function AuthorLayerView({ sets, sources, sourceIds, colorMap, contributions, onAddContribution, grouping }) {
  const contentLayers = LAYERS.filter(l => !l.isMorph);
  const morphAuthorId = sourceIds[0];

  return sourceIds.map(srcId => {
    const color  = colorMap[srcId] || COLOR_SLOTS[0];
    const author = srcLabel(sources[srcId], srcId);
    const authorSets = sets.filter(s => String(s.source_id) === srcId).sort((a, b) => a.seq - b.seq);
    const isMorphAuthor = srcId === morphAuthorId;

    const header = (
      <div className="author-section-header" style={{ borderLeft: `3px solid ${color.border}`, background: color.bg }}>
        <span className="author-section-name" style={{ color: color.text }}>{author}</span>
      </div>
    );

    if (grouping === 'author-layer') {
      // Author → Layer: group all entries under each layer heading
      const morphs = isMorphAuthor ? authorSets.flatMap(s => s.morphs || []) : [];
      const layerHasAny = contentLayers.some(l =>
        authorSets.some(s => (s.contents || []).some(c => contentTypeToLayer(c.type) === l.key))
      );
      if (!layerHasAny && morphs.length === 0) return null;
      return (
        <div key={srcId} className={`author-section author-${srcId}`}>
          {header}
          {contentLayers.map(l => {
            const entries = authorSets.flatMap(s => {
              const text = (s.contents || []).find(c => contentTypeToLayer(c.type) === l.key)?.text;
              return text ? [{ seq: s.seq, type: s.type, text }] : [];
            });
            if (!entries.length) return null;
            return (
              <div key={l.key} className={`v2-layer-row-group author-block-row ${l.cls}`}>
                <span className="v2-layer-row-label">{l.label}</span>
                <div className="v2-layer-authors">
                  {entries.map(e => (
                    <div key={e.seq} className="author-line-flat">
                      <span className="entry-seq-tag">{e.type === 'omen' ? `${e.seq}.` : `${e.seq}.`}</span>
                      <span className={`v2-layer-text v2-text-${l.key}`}>{e.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {morphs.length > 0 && (
            <div className="v2-layer-row-group author-block-row layer-morph-transcr layer-morph-gloss">
              <span className="v2-layer-row-label">Morph.</span>
              <MorphInterlinear morphs={morphs} />
            </div>
          )}
        </div>
      );
    }

    // author-entry-layer: per-entry sub-sections (original behavior)
    return (
      <div key={srcId} className={`author-section author-${srcId}`}>
        {header}
        {authorSets.map(set => {
          const label = set.type === 'omen' ? `Omen ${set.seq}` : `Line ${set.seq}`;
          const contentByLayer = {};
          (set.contents || []).forEach(c => {
            const lk = contentTypeToLayer(c.type);
            if (lk && !contentByLayer[lk]) contentByLayer[lk] = c.text;
          });
          const morphs = isMorphAuthor ? (set.morphs || []) : [];
          const hasAny = contentLayers.some(l => contentByLayer[l.key]) || morphs.length > 0;
          if (!hasAny) return null;

          return (
            <div key={set.id} className="author-section-entry">
              <div className="author-section-entry-label">{label}</div>
              {contentLayers.map(l => {
                const text = contentByLayer[l.key];
                if (!text) return null;
                return (
                  <div key={l.key} className={`v2-layer-row-group author-block-row ${l.cls}`}>
                    <span className="v2-layer-row-label">{l.label}</span>
                    <span className={`v2-layer-text v2-text-${l.key}`}>{text}</span>
                  </div>
                );
              })}
              {morphs.length > 0 && (
                <div className="v2-layer-row-group author-block-row layer-morph-transcr layer-morph-gloss">
                  <span className="v2-layer-row-label">Morph.</span>
                  <MorphInterlinear morphs={morphs} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  });
}

// Legend bar — maps color dot to author name, shown only when >1 author active
function LegendBar({ sourceIds, sources, hiddenAuthors, colorMap }) {
  const active = sourceIds.filter(id => !hiddenAuthors.has(id));
  if (active.length <= 1) return null;
  return (
    <div className="legend-bar">
      {active.map(id => {
        const color = colorMap[id] || COLOR_SLOTS[0];
        return (
          <span key={id} className="legend-entry" style={{ borderLeft: `2px solid ${color.border}` }}>
            <span className="legend-dot" style={{ color: color.border }}>●</span>
            {srcLabel(sources[id], id)}
          </span>
        );
      })}
    </div>
  );
}

// Author filter pills
function AuthorFilterRow({ sourceIds, sources, hiddenAuthors, onToggle, colorMap }) {
  return (
    <div className="stk-filter-group">
      <span className="stk-filter-label">Authors</span>
      <div className="stk-pills">
        {sourceIds.map(id => {
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
              {visible && <span className="pill-dot" style={{ color: color.border }}>●</span>}
              {srcLabel(sources[id], id)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Layer filter pills
function LayerFilterRow({ hiddenLayers, onToggle }) {
  const morphVisible = !hiddenLayers.has('morph-transcr') && !hiddenLayers.has('morph-gloss');
  const toggleMorph = () => {
    onToggle('morph-transcr');
    onToggle('morph-gloss');
  };
  return (
    <div className="stk-filter-group">
      <span className="stk-filter-label">Layers</span>
      <div className="stk-pills">
        {LAYERS.filter(l => !l.isMorph).map(l => {
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
        <button
          className={`stk-pill${morphVisible ? ' active' : ''}`}
          onClick={toggleMorph}
          aria-pressed={morphVisible}
        >
          Morph.
        </button>
      </div>
    </div>
  );
}

function ManuscriptPanel({ artifact }) {
  const [activeImg, setActiveImg] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const { data: groups } = useFetch(`/api/artifacts/${artifact.shortname}/image_groups`);
  const allImgs = Array.isArray(groups) ? groups.flatMap(g => g.images || []) : [];
  const currentImg = activeImg || (allImgs[0]?.uri ? `/api/images/${allImgs[0].uri}` : null);

  return (
    <>
      {fullscreen && currentImg && (
        <div className="img-fullscreen-overlay" onClick={() => setFullscreen(false)}>
          <img src={currentImg} alt={artifact.label} className="img-fullscreen-img" onClick={e => e.stopPropagation()} />
          <button className="img-fullscreen-close" onClick={() => setFullscreen(false)}>✕</button>
        </div>
      )}
      <div className="v2-manuscript-panel">
        <div className="v2-panel-header">Manuscript</div>
        {currentImg
          ? (
            <div className="img-wrapper">
              <img className="v2-manuscript-img" src={currentImg} alt={artifact.label}
                onError={e => { e.target.style.display = 'none'; }} />
              <button className="img-fullscreen-btn" onClick={() => setFullscreen(true)} title="Fullscreen">⛶</button>
            </div>
          )
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
      </div>
    </>
  );
}

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

  const colorMap = {};
  sourceIds.forEach((id, i) => { colorMap[id] = COLOR_SLOTS[i % COLOR_SLOTS.length]; });

  const [hiddenAuthors, setHiddenAuthors] = useState(() => {
    const p = searchParams.get('hidden_authors');
    return p ? new Set(p.split(',')) : new Set();
  });
  const [hiddenLayers, setHiddenLayers] = useState(() => {
    const p = searchParams.get('hidden_layers');
    return p ? new Set(p.split(',')) : new Set();
  });
  const [grouping, setGrouping] = useState(() => searchParams.get('grouping') || 'entry-layer-author');

  useEffect(() => {
    const p = {};
    if (hiddenAuthors.size) p.hidden_authors = [...hiddenAuthors].join(',');
    if (hiddenLayers.size)  p.hidden_layers  = [...hiddenLayers].join(',');
    if (grouping !== 'entry-layer-author') p.grouping = grouping;
    setSearchParams(p, { replace: true });
  }, [hiddenAuthors, hiddenLayers, grouping]);

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
  const activeAuthors = sourceIds.filter(id => !hiddenAuthors.has(id));
  const isSingleAuthor = activeAuthors.length === 1;

  const hideClasses = [
    ...[...hiddenAuthors].map(id => `hide-author-${id}`),
    ...[...hiddenLayers].map(k => `hide-layer-${k}`),
    isSingleAuthor ? 'single-author' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="v2-viewer-layout">
      <ManuscriptPanel artifact={artifact} />

      <div className="v2-center-panel">
        {/* filter bar — authors row + layers row */}
        <div className="v2-controls-bar">
          <div className="v2-controls-row">
            <AuthorFilterRow
              sourceIds={sourceIds}
              sources={sources}
              hiddenAuthors={hiddenAuthors}
              onToggle={toggleAuthor}
              colorMap={colorMap}
            />
          </div>
          <div className="v2-controls-row">
            <LayerFilterRow hiddenLayers={hiddenLayers} onToggle={toggleLayer} />
          </div>
          <div className="v2-controls-row">
            <GroupingControl grouping={grouping} onChange={setGrouping} />
          </div>
        </div>

        {/* legend bar — only appears when >1 author active */}
        <LegendBar
          sourceIds={sourceIds}
          sources={sources}
          hiddenAuthors={hiddenAuthors}
          colorMap={colorMap}
        />

        {/* text display — all filtering via CSS class toggling, no re-render */}
        <div className={`v2-text-display ${hideClasses}`}>
          {(grouping === 'author-layer' || grouping === 'author-entry-layer') ? (
            <AuthorLayerView
              sets={sets} sources={sources} sourceIds={sourceIds}
              colorMap={colorMap} contributions={contributions} onAddContribution={addContribution}
              grouping={grouping}
            />
          ) : (grouping === 'layer-entry-author' || grouping === 'layer-author-entry') ? (
            <LayerFirstView
              grouping={grouping} sets={sets} sources={sources}
              sourceIds={sourceIds} colorMap={colorMap}
            />
          ) : (
            omenSeqs.map(seq => {
              const seqSets = sets
                .filter(s => s.seq === seq)
                .sort((a, b) => sourceIds.indexOf(String(a.source_id)) - sourceIds.indexOf(String(b.source_id)));
              return (
                <OmenBlock
                  key={seq} omenSeq={seq} omenType={seqSets[0]?.type || 'omen'}
                  sets={seqSets} sources={sources} colorMap={colorMap}
                  contributions={contributions} onAddContribution={addContribution}
                  grouping={grouping}
                />
              );
            })
          )}

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
