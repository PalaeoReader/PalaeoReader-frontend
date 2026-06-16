import React, { useState, useEffect, useCallback, useRef } from 'react';
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

function morphsToText(morphs) {
  const byToken = {};
  morphs.forEach(m => {
    if (!byToken[m.token_seq]) byToken[m.token_seq] = {};
    if (!byToken[m.token_seq][m.seq]) byToken[m.token_seq][m.seq] = { form: '', gloss: '' };
    if (m.type.startsWith('morpheme')) byToken[m.token_seq][m.seq].form = m.text;
    if (m.type === 'gloss') byToken[m.token_seq][m.seq].gloss = m.text;
  });
  const tokenSeqs = [...new Set(morphs.map(m => m.token_seq))].sort((a, b) => a - b);
  return tokenSeqs.map(tseq => {
    const pairs = byToken[tseq];
    return Object.keys(pairs).sort((a, b) => Number(a) - Number(b))
      .map(seq => `${pairs[seq].form || ''}:${pairs[seq].gloss || ''}`)
      .join('-');
  }).join(' ');
}

function EditableMorphLine({ lineKey, sourceId, color, morphs, sourceLabel, editProps }) {
  const [hovered, setHovered] = useState(false);
  const isActive  = editProps?.activeEditor?.lineKey === lineKey;
  const isEdited  = lineKey in (editProps?.lineOverrides || {});
  const overrideText = editProps?.lineOverrides?.[lineKey];

  if (isActive) {
    return (
      <InlineEditor
        initialText={isEdited ? overrideText : morphsToText(morphs)}
        color={color}
        sourceLabel={sourceLabel}
        layerLabel="Morph. analysis"
        onCancel={editProps.closeEditor}
        onSubmit={(newText, contributor) =>
          editProps.submitEdit(lineKey, newText, contributor, { sourceLabel, layerLabel: 'Morph. analysis', layerKey: 'morph', originalText: isEdited ? overrideText : morphsToText(morphs) })}
      />
    );
  }

  return (
    <div
      className={`author-line author-morph author-${sourceId}${isEdited ? ' line-edited' : ''}`}
      style={{
        borderLeft: `2px solid ${color.border}`,
        background: hovered ? color.bg : color.row,
        outline: hovered && editProps ? `1px solid ${color.border}80` : 'none',
        alignItems: 'flex-start',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isEdited && <span className="line-edited-dot" />}
      <span className="author-dot" style={{ color: color.border, paddingTop: '0.2rem' }}>●</span>
      {isEdited
        ? <span className="v2-layer-text" style={{ paddingTop: '0.2rem' }}>{overrideText}</span>
        : <MorphInterlinear morphs={morphs} />
      }
      {editProps && (
        <div className="line-btn-group">
          <button className="clock-btn" onClick={e => { e.stopPropagation(); editProps.openHistory(lineKey, { sourceLabel, layerLabel: 'Morph. analysis' }); }}>
            <i className="fas fa-clock" />
          </button>
          <button className="pencil-btn"
            onClick={e => { e.stopPropagation(); editProps.openEditor(lineKey, { sourceId, layerKey: 'morph', layerLabel: 'Morph. analysis', sourceLabel }); }}>
            <i className="fas fa-pen" />
          </button>
        </div>
      )}
    </div>
  );
}

function EditableText({ lineKey, sourceId, layerKey, layerLabel, sourceLabel, color, rawText, editProps, className, dir }) {
  const [hovered, setHovered] = useState(false);
  const isActive  = editProps?.activeEditor?.lineKey === lineKey;
  const isEdited  = lineKey in (editProps?.lineOverrides || {});
  const displayText = isEdited ? editProps.lineOverrides[lineKey] : rawText;
  const effectiveDir = dir || detectDir(rawText);
  const isRtl = layerKey === 'script';

  if (isActive) {
    return (
      <InlineEditor
        initialText={displayText}
        color={color} dir={effectiveDir}
        sourceLabel={sourceLabel}
        layerLabel={layerLabel}
        onCancel={editProps.closeEditor}
        onSubmit={(newText, contributor) =>
          editProps.submitEdit(lineKey, newText, contributor, { sourceLabel, layerLabel, layerKey, originalText: displayText })}
      />
    );
  }

  return (
    <div
      className="editable-text-wrap"
      style={{
        outline: hovered && editProps ? `1px solid ${color.border}80` : 'none',
        borderRadius: 2,
        background: hovered && editProps ? color.bg : undefined,
        ...(isRtl ? { flexDirection: 'row-reverse' } : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isEdited && <span className="line-edited-dot" />}
      <span className={className} dir={effectiveDir}>{displayText}</span>
      {editProps && (
        <div className="line-btn-group">
          <button className="clock-btn" onClick={e => { e.stopPropagation(); editProps.openHistory(lineKey, { sourceLabel, layerLabel }); }}>
            <i className="fas fa-clock" />
          </button>
          <button className="pencil-btn"
            onClick={e => { e.stopPropagation(); editProps.openEditor(lineKey, { sourceId, layerKey, layerLabel, sourceLabel }); }}>
            <i className="fas fa-pen" />
          </button>
        </div>
      )}
    </div>
  );
}


function relativeTime(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60)     return 'just now';
  const m = Math.floor(s / 60);
  if (s < 3600)   return `${m} ${m === 1 ? 'minute' : 'minutes'} ago`;
  const h = Math.floor(s / 3600);
  if (s < 86400)  return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  const d = Math.floor(s / 86400);
  if (s < 604800) return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function wordDiff(oldStr, newStr) {
  // Each token includes its trailing separator so display reconstructs original exactly
  function tokenize(s) {
    const tokens = [];
    const re = /[^\s᛬᛫]+[\s᛬᛫]*/g;
    let m;
    while ((m = re.exec(s || '')) !== null) tokens.push(m[0]);
    return tokens;
  }
  const a = tokenize(oldStr);
  const b = tokenize(newStr);
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const ops = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
      ops.unshift({ t: '=', w: a[i-1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      ops.unshift({ t: '+', w: b[j-1] }); j--;
    } else {
      ops.unshift({ t: '-', w: a[i-1] }); i--;
    }
  }
  return ops;
}

function DiffBlock({ oldText, newText }) {
  const ops = wordDiff(oldText, newText);
  const dir = detectDir(oldText || newText);
  // Tokens include trailing separators — just concatenate, no space needed
  const removedLine = ops.filter(o => o.t !== '+').map((o, i) =>
    o.t === '-'
      ? <span key={i} className="hl-removed">{o.w}</span>
      : <span key={i} className="hl-equal">{o.w}</span>
  );
  const addedLine = ops.filter(o => o.t !== '-').map((o, i) =>
    o.t === '+'
      ? <span key={i} className="hl-added">{o.w}</span>
      : <span key={i} className="hl-equal">{o.w}</span>
  );
  return (
    <div className="eh-diff-block">
      <div className="eh-diff-row eh-diff-removed">
        <span className="eh-diff-sign">−</span>
        <span className="eh-diff-line" dir={dir}>{removedLine}</span>
      </div>
      <div className="eh-diff-row eh-diff-added">
        <span className="eh-diff-sign">+</span>
        <span className="eh-diff-line" dir={dir}>{addedLine}</span>
      </div>
    </div>
  );
}

function detectDir(text) {
  if (!text) return undefined;
  let rtl = 0, ltr = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (
      (cp >= 0x0590 && cp <= 0x08FF)   ||  // Hebrew, Arabic, Syriac, Thaana, NKo …
      (cp >= 0xFB1D && cp <= 0xFDFF)   ||  // Hebrew/Arabic presentation forms A
      (cp >= 0xFE70 && cp <= 0xFEFF)   ||  // Arabic presentation forms B
      (cp >= 0x10C00 && cp <= 0x10C4F) ||  // Old Turkic
      (cp >= 0x10840 && cp <= 0x1085F) ||  // Imperial Aramaic
      (cp >= 0x10900 && cp <= 0x1091F)     // Phoenician
    ) rtl++;
    else if ((cp >= 0x41 && cp <= 0x7A) || (cp >= 0x30 && cp <= 0x39)) ltr++;
  }
  if (rtl === 0) return undefined;
  return rtl >= ltr ? 'rtl' : 'auto';
}

function charDiff(refStr, othStr) {
  const a = Array.from(refStr || ''), b = Array.from(othStr || '');
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const ops = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
      ops.unshift({ t: '=', c: a[i-1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      ops.unshift({ t: '+', c: b[j-1] }); j--;
    } else {
      ops.unshift({ t: '-', c: a[i-1] }); i--;
    }
  }
  return ops;
}

function InlineDiff({ refText, otherText, layerKey, dir }) {
  const ops = charDiff(refText, otherText);
  const mono = layerKey === 'translit' || layerKey === 'transcription';
  return (
    <span className={`inline-diff${mono ? ' inline-diff-mono' : ''}`} dir={dir}>
      {ops.map((o, i) =>
        o.t === '=' ? <span key={i} className="id-eq">{o.c}</span>
        : o.t === '-' ? <span key={i} className="id-del">{o.c}</span>
        : <span key={i} className="id-add">{o.c}</span>
      )}
    </span>
  );
}

function InlineEditor({ initialText, color, sourceLabel, layerLabel, dir, onCancel, onSubmit }) {
  const [text, setText]            = useState(initialText);
  const [contributor, setContrib]  = useState('');
  const ref                        = useRef(null);

  useEffect(() => {
    if (ref.current) { ref.current.focus(); const l = text.length; ref.current.setSelectionRange(l, l); }
  }, []);

  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') onCancel();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  });

  const submit = () => {
    if (!text.trim() || text.trim() === initialText.trim()) { onCancel(); return; }
    onSubmit(text.trim(), contributor.trim() || 'anonymous');
  };

  return (
    <div className="inline-editor" style={{ borderColor: color.border }}>
      <div className="inline-editor-top">
        <div className="inline-editor-name-wrap">
          <span className="inline-editor-name-label">Your name</span>
          <input className="inline-editor-name" placeholder="name or handle"
            value={contributor} onChange={e => setContrib(e.target.value)} />
        </div>
        <span className="inline-editor-ctx">{sourceLabel} · {layerLabel}</span>
      </div>
      <textarea ref={ref} className="inline-editor-textarea" rows={2}
        dir={dir} value={text} onChange={e => setText(e.target.value)} />
      <div className="inline-editor-bottom">
        <div className="inline-editor-btns">
          <button className="inline-editor-submit" onClick={submit}>Submit fix</button>
          <button className="inline-editor-cancel" onClick={onCancel}>Cancel</button>
        </div>
        <div className="inline-editor-notes">
          <span className="inline-editor-note">corrects the source record · logged in history.</span>
          <span className="inline-editor-note">Esc to cancel · ⌘↵ to submit</span>
        </div>
      </div>
    </div>
  );
}

function EditableLine({ lineKey, sourceId, color, layerKey, text, isEdited, sourceLabel, layerLabel, editProps, pinProps }) {
  const [hovered, setHovered] = useState(false);
  const isActive    = editProps?.activeEditor?.lineKey === lineKey;
  const highlighted = editProps?.highlightedLine === lineKey;
  const dir         = detectDir(text);
  const isRtl       = layerKey === 'script';

  const isPinned = pinProps?.pinnedKey === lineKey;
  const showDiff = pinProps != null && pinProps.pinnedKey != null && !isPinned;

  if (isActive) {
    return (
      <InlineEditor
        initialText={text} color={color} dir={dir}
        sourceLabel={sourceLabel} layerLabel={layerLabel}
        onCancel={editProps.closeEditor}
        onSubmit={(newText, contributor) =>
          editProps.submitEdit(lineKey, newText, contributor, { sourceLabel, layerLabel, layerKey, originalText: text })}
      />
    );
  }

  return (
    <div
      className={`author-line author-${sourceId}${isEdited ? ' line-edited' : ''}${highlighted ? ' line-highlighted' : ''}${pinProps ? ' has-pin' : ''}${pinProps?.pinnedKey != null ? ' line-dimmed' : ''}`}
      style={{
        borderLeft: `2px solid ${color.border}`,
        background: hovered ? color.bg : color.row,
        outline: hovered ? `1px solid ${color.border}80` : 'none',
        position: 'relative',
        ...(isRtl ? { flexDirection: 'row-reverse' } : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isEdited && <span className="line-edited-dot" />}
      <span className="author-dot" data-tip={sourceLabel} style={{ color: color.border }}>●</span>
      {showDiff
        ? <InlineDiff refText={pinProps.pinnedText} otherText={text} layerKey={layerKey} dir={dir} />
        : <span className={`v2-layer-text v2-text-${layerKey}`} dir={dir}>{text}</span>
      }
      {isPinned && <span className="ref-tag">ref</span>}
      {(pinProps || editProps) && (
        <div className="line-btn-group">
          {pinProps && (
            <button
              className={`pin-btn${isPinned ? ' pin-btn-active' : ''}`}
              onClick={e => { e.stopPropagation(); pinProps.onPin(lineKey); }}>
              <i className="fas fa-thumbtack" />
            </button>
          )}
          {editProps && (
            <button className="clock-btn" onClick={e => { e.stopPropagation(); editProps.openHistory(lineKey, { sourceLabel, layerLabel }); }}>
              <i className="fas fa-clock" />
            </button>
          )}
          {editProps && (
            <button className="pencil-btn"
              onClick={e => { e.stopPropagation(); editProps.openEditor(lineKey, { sourceId, layerKey, layerLabel, sourceLabel }); }}>
              <i className="fas fa-pen" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CommitBrowserView({ lineKey, editLog, lineOverrides, colorMap, onRestore, onBack }) {
  const [selectedId, setSelectedId] = useState(null);

  const lineEdits = editLog.filter(e => e.lineKey === lineKey);
  const currentText = lineOverrides[lineKey] ?? '';
  const importText  = lineEdits.length > 0 ? lineEdits[lineEdits.length - 1].originalText : currentText;

  const timeline = [
    ...lineEdits,
    { id: 'original', isImport: true, contributor: lineEdits[0]?.sourceLabel || 'Source', newText: importText },
  ];

  const currentCommitId = [...lineEdits].reverse().find(c => c.newText === currentText)?.id
    ?? (importText === currentText ? 'original' : null);

  const selected = timeline.find(c => c.id === selectedId) || null;

  return (
    <div className="eh-panel">
      <div className="eh-commit-header">
        <button className="eh-back-btn" onClick={onBack}>← Back</button>
        <span className="eh-commit-title">Versions</span>
      </div>
      <div className="eh-commit-subtitle">Click a version to preview · restore to make it current</div>
      <div className="eh-commit-timeline">
        {timeline.map((commit, idx) => {
          const isCurrent  = commit.id === currentCommitId;
          const isSelected = commit.id === selectedId;
          const dot = colorMap ? (Object.values(colorMap)[0]?.border || '#888') : '#888';
          return (
            <div key={commit.id}
              className={`eh-commit-row${isSelected ? ' selected' : ''}`}
              onClick={() => setSelectedId(isSelected ? null : commit.id)}>
              <div className="eh-commit-line-col">
                <span className="eh-commit-dot" style={{ background: isCurrent ? '#0F6E56' : 'var(--v2-bd-em)' }} />
                {idx < timeline.length - 1 && <span className="eh-commit-vline" />}
              </div>
              <div className="eh-commit-info">
                <div className="eh-commit-meta">
                  <span className="eh-contributor">{commit.contributor}</span>
                  {isCurrent && <span className="eh-current-label">current</span>}
                  {!commit.isImport && <span className="eh-time">{relativeTime(commit.id)}</span>}
                </div>
                <div className="eh-commit-preview">{(commit.newText || '').slice(0, 70)}{(commit.newText || '').length > 70 ? '…' : ''}</div>
              </div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div className="eh-commit-diff-area">
          {selected.id === currentCommitId ? (
            <div className="eh-diff-block">
              <div className="eh-diff-row eh-diff-added">
                <span className="eh-diff-sign">+</span>
                <span className="eh-diff-line"><span className="hl-equal">{selected.newText}</span></span>
              </div>
            </div>
          ) : (
            <DiffBlock oldText={currentText} newText={selected.newText} />
          )}
          {selected.id !== currentCommitId && (
            <span className="eh-link eh-link-blue" onClick={() => { onRestore(lineKey, selected.newText); onBack(); }}>
              Restore this version
            </span>
          )}
        </div>
      )}
      <span className="eh-link eh-link-muted eh-cancel-link" onClick={onBack}>Cancel</span>
    </div>
  );
}

function EditHistoryPanel({ editLog, lineOverrides, onUndo, onFlag, onViewInText, onRestore, colorMap, sources, sourceIds, historyFilter, onClearHistoryFilter }) {
  const [browser, setBrowser]       = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpanded = id =>
    setExpandedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const displayLog = historyFilter
    ? editLog.filter(e => e.lineKey === historyFilter.lineKey)
    : editLog;

  const latestPerLine = {};
  editLog.forEach(e => { if (!latestPerLine[e.lineKey]) latestPerLine[e.lineKey] = e.id; });

  const filterLabel = historyFilter
    ? `${historyFilter.entryLabel} · ${historyFilter.sourceLabel} · ${historyFilter.layerLabel}`
    : null;

  if (browser) {
    return (
      <CommitBrowserView
        lineKey={browser}
        editLog={editLog}
        lineOverrides={lineOverrides}
        colorMap={colorMap}
        onRestore={onRestore}
        onBack={() => setBrowser(null)}
      />
    );
  }

  return (
    <div className="eh-panel">
      <div className="eh-header">
        <span className="eh-header-label">
          <i className="fas fa-history eh-header-icon" />
          Edit history
        </span>
        {editLog.length > 0 && (
          <span className="eh-count-badge">{editLog.length} edit{editLog.length !== 1 ? 's' : ''}</span>
        )}
      </div>
      {historyFilter && (
        <div className="eh-filter-bar">
          <span className="eh-filter-label">Showing history for: {filterLabel}</span>
          <span className="eh-link eh-link-muted" onClick={onClearHistoryFilter}>show all</span>
        </div>
      )}
      <div className="eh-feed">
        {displayLog.length === 0 && (
          <div className="eh-empty">
            {!historyFilter && <i className="fas fa-history" style={{ fontSize: 18, opacity: 0.25, display:'block', marginBottom:'0.5rem' }} />}
            {historyFilter
              ? 'No edits yet for this line.'
              : 'No edits yet. Hover any line and click the pen to contribute.'
            }
          </div>
        )}
        {displayLog.map(entry => {
          const isLatest    = latestPerLine[entry.lineKey] === entry.id;
          const isExpanded  = expandedIds.has(entry.id);
          const dotColor    = entry.isUndo ? '#185FA5' : COMMUNITY_COLOR.border;
          const contributor = entry.isUndo ? `${entry.contributor} — reverted` : entry.contributor;
          return (
            <div key={entry.id} className={`eh-entry${entry.flagged ? ' eh-entry-flagged' : ''}`}>
              <div className="eh-entry-header" onClick={() => toggleExpanded(entry.id)}>
                <span className="eh-dot" style={{ background: dotColor }} />
                <span className="eh-contributor">{contributor}</span>
                {isLatest && <span className="eh-latest-label">latest</span>}
                <span className="eh-time">{relativeTime(entry.id)}</span>
                <i className={`fas fa-chevron-down eh-chevron${isExpanded ? ' eh-chevron-open' : ''}`} />
              </div>
              {isExpanded && <>
                <div className="eh-location">
                  {entry.omenLabel} · {entry.sourceLabel} · {entry.layerLabel}
                </div>
                <div className="eh-diff-left-border">
                  <DiffBlock oldText={entry.originalText} newText={entry.newText} />
                </div>
                <div className="eh-actions-text">
                  <span className="eh-link eh-link-blue" onClick={() => setBrowser(entry.lineKey)}>browse versions</span>
                  {isLatest && !entry.isUndo && <>
                    <span className="eh-sep">·</span>
                    <span className="eh-link eh-link-coral" onClick={() => onUndo(entry)}>undo</span>
                  </>}
                  <span className="eh-sep">·</span>
                  <span className={`eh-link${entry.flagged ? ' eh-link-coral' : ' eh-link-muted'}`} onClick={() => onFlag(entry.id)}>
                    {entry.flagged ? 'unflag' : 'flag'}
                  </span>
                </div>
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompareDiffPanel({ rows, sources, onClose }) {
  const [refSourceId, setRefSourceId] = useState(rows[0]?.sourceId);
  const [bodyHeight, setBodyHeight]   = useState(null);
  const effectiveRefId = rows.some(r => r.sourceId === refSourceId) ? refSourceId : rows[0]?.sourceId;
  const refRow    = rows.find(r => r.sourceId === effectiveRefId);
  const otherRows = rows.filter(r => r.sourceId !== effectiveRefId);

  const startResize = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = bodyHeight || 180;
    const onMove = ev => setBodyHeight(Math.max(80, startH + ev.clientY - startY));
    const onUp   = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [bodyHeight]);

  return (
    <div className="compare-panel">
      <div className="compare-panel-top">
        <div className="compare-panel-left">
          <span className="compare-ref-label">Reference:</span>
          {rows.map(r => (
            <button key={r.sourceId}
              className={`compare-pill${r.sourceId === effectiveRefId ? ' active' : ''}`}
              onClick={() => setRefSourceId(r.sourceId)}>
              {srcLabel(sources[r.sourceId], r.sourceId)}
            </button>
          ))}
        </div>
        <button className="compare-close-btn" onClick={onClose}><i className="fas fa-times" /></button>
      </div>
      <div className="compare-body" style={bodyHeight ? { height: bodyHeight } : undefined}>
        {otherRows.map((r, i) => {
          const refText = refRow?.text || '';
          const othText = r.text || '';
          const identical = refText.trim() === othText.trim();
          const dir = detectDir(refText || othText);
          const ops = wordDiff(refText, othText);
          return (
            <div key={r.sourceId} className={`compare-block${i > 0 ? ' compare-block-sep' : ''}`}>
              <div className="compare-block-label">vs {srcLabel(sources[r.sourceId], r.sourceId)}</div>
              {identical ? (
                <div className="compare-identical">identical</div>
              ) : (
                <div className="compare-diff-lines">
                  <div className="compare-diff-line" dir={dir}>
                    {ops.filter(o => o.t !== '+').map((o, j) =>
                      o.t === '-'
                        ? <span key={j} className="hl-removed">{o.w}</span>
                        : <span key={j} className="hl-equal">{o.w}</span>
                    )}
                  </div>
                  <div className="compare-diff-line" dir={dir}>
                    {ops.filter(o => o.t !== '-').map((o, j) =>
                      o.t === '+'
                        ? <span key={j} className="hl-added">{o.w}</span>
                        : <span key={j} className="hl-equal">{o.w}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="compare-resize-handle" onMouseDown={startResize}>
        <span className="compare-resize-grip">⠿</span>
      </div>
    </div>
  );
}

function OmenLayerGroup({ l, activeRows, extraContribs, omenSeq, sources, editProps }) {
  const [pinnedKey, setPinnedKey] = useState(null);
  const hasMultiple = activeRows.length > 1;

  const rowsWithKey = activeRows.map(r => {
    const lKey        = `${omenSeq}-${r.sourceId}-${l.key}`;
    const currentText = editProps?.lineOverrides?.[lKey] ?? r.text;
    const isEdited    = lKey in (editProps?.lineOverrides || {});
    return { ...r, lKey, text: currentText, isEdited };
  });

  const pinnedText = pinnedKey ? (rowsWithKey.find(r => r.lKey === pinnedKey)?.text ?? null) : null;
  const pinProps   = hasMultiple
    ? { pinnedKey, pinnedText, onPin: lk => setPinnedKey(k => k === lk ? null : lk) }
    : null;

  return (
    <div className={`v2-layer-group-wrap ${l.cls}`}>
      <div className="v2-layer-row-group v2-layer-row-group--inner">
        <div className="v2-layer-label-cell">
          <span className="v2-layer-row-label">{l.label}</span>
        </div>
        <div className="v2-layer-authors">
          {rowsWithKey.map(r => (
            <EditableLine key={r.sourceId}
              lineKey={r.lKey} sourceId={r.sourceId} color={r.color}
              layerKey={l.key} text={r.text}
              isEdited={r.isEdited}
              sourceLabel={srcLabel(sources[r.sourceId], r.sourceId)}
              layerLabel={l.label}
              editProps={editProps}
              pinProps={pinProps}
            />
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
    </div>
  );
}

function LayerEntryGroup({ seq, entryLabel, rows, sources, layerKey, layerLabel, editProps }) {
  const [pinnedKey, setPinnedKey] = useState(null);
  const hasMultiple = rows.length > 1;

  const rowsWithKey = rows.map(r => {
    const lKey        = `${seq}-${r.sourceId}-${layerKey}`;
    const currentText = editProps?.lineOverrides?.[lKey] ?? r.text;
    const isEdited    = lKey in (editProps?.lineOverrides || {});
    return { ...r, lKey, text: currentText, isEdited };
  });

  const pinnedText = pinnedKey ? (rowsWithKey.find(r => r.lKey === pinnedKey)?.text ?? null) : null;
  const pinProps   = hasMultiple
    ? { pinnedKey, pinnedText, onPin: lk => setPinnedKey(k => k === lk ? null : lk) }
    : null;

  return (
    <div className="layer-section-entry">
      <div className="layer-section-entry-label-wrap">
        <div className="layer-section-entry-label">{entryLabel}</div>
      </div>
      {rowsWithKey.map(r => (
        <EditableLine key={r.sourceId}
          lineKey={r.lKey} sourceId={r.sourceId} color={r.color}
          layerKey={layerKey} text={r.text}
          isEdited={r.isEdited}
          sourceLabel={srcLabel(sources[r.sourceId], r.sourceId)}
          layerLabel={layerLabel}
          editProps={editProps}
          pinProps={pinProps}
        />
      ))}
    </div>
  );
}

const LINE_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

function CroppedLineImage({ src, sel, color, label }) {
  const [dims, setDims] = useState(null);
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);
  if (!dims) return null;

  const actualW = sel.width * dims.w;
  const actualH = sel.height * dims.h;
  const isVertical = actualH > actualW * 1.5;

  // For vertical selections: rotate -90deg so they display as horizontal strips.
  // Scale so the rotated result fits maxDisplayW × maxDisplayH.
  // After rotation, displayed width = cropH and displayed height = cropW.
  const maxDisplayW = 220, maxDisplayH = 50;
  const scale = isVertical
    ? Math.min(maxDisplayH / actualW, maxDisplayW / actualH)
    : Math.min(maxDisplayW / actualW, maxDisplayH / actualH);
  const cropW = Math.round(actualW * scale);
  const cropH = Math.round(actualH * scale);

  // displayW/H are the final on-screen dimensions
  const displayW = isVertical ? cropH : cropW;
  const displayH = isVertical ? cropW : cropH;

  const cleanLabel = label
    .replace(/\s*\((vertical|horizontal)\)/gi, '')
    .replace(/\bline\b\s*/gi, '')
    .trim();

  const imgEl = (
    <img src={src} alt="" style={{
      position: 'absolute',
      width:  Math.round(dims.w * scale),
      height: Math.round(dims.h * scale),
      left: -Math.round(sel.left * dims.w * scale),
      top:  -Math.round(sel.top  * dims.h * scale),
      display: 'block',
    }} />
  );

  return (
    <div style={{ marginBottom: '0.35rem' }}>
      {isVertical ? (
        /* Outer div claims the rotated (displayW × displayH) space in flow */
        <div style={{ width: displayW, height: displayH, position: 'relative' }}>
          {/* Inner div is the actual cropW×cropH crop region, rotated -90deg around its center,
              positioned so its rotated bounds exactly fill the outer div */}
          <div style={{
            width: cropW, height: cropH,
            position: 'absolute',
            left: Math.round((cropH - cropW) / 2),
            top:  Math.round((cropW - cropH) / 2),
            overflow: 'hidden',
            transform: 'rotate(90deg)',
            borderRadius: 2,
          }}>
            {imgEl}
          </div>
        </div>
      ) : (
        <div style={{ width: displayW, height: displayH, overflow: 'hidden', position: 'relative', borderRadius: 2 }}>
          {imgEl}
        </div>
      )}
    </div>
  );
}

// Unified omen block — supports entry-layer-author and entry-author-layer grouping modes.
function OmenBlock({ omenSeq, omenType, sets, sources, colorMap, contributions, onAddContribution, grouping, editProps, lineRegionsByContentId, lineContentIds, canonicalFirstContentId }) {
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
      if (lk && !contentByLayer[lk]) contentByLayer[lk] = { text: c.text, dir: c.text_direction || null };
    });
    contentLayers.forEach(l => {
      const entry = contentByLayer[l.key];
      byLayer[l.key].push({ sourceId: String(set.source_id), color, text: entry?.text || null, dir: entry?.dir || null });
    });
    bySrc[String(set.source_id)] = { color, contentByLayer };
  });

  const contribsByLayer = {};
  contribs.forEach(c => {
    const lk = c.layer === 'transliteration' ? 'translit' : c.layer;
    if (!contribsByLayer[lk]) contribsByLayer[lk] = [];
    contribsByLayer[lk].push(c);
  });

  const firstContentId = canonicalFirstContentId ?? sets[0]?.contents?.[0]?.id ?? null;
  // Show the crop from every source that has one for this line, not just one.
  const contentIdsForLine = (lineContentIds && lineContentIds.length > 0)
    ? lineContentIds
    : (firstContentId ? [firstContentId] : []);
  const lineRegions = lineRegionsByContentId
    ? contentIdsForLine.flatMap(cid => lineRegionsByContentId[cid] || [])
    : [];

  return (
    <div className="v2-omen-block" id={`omen-${omenSeq}`}>
      <div className="v2-omen-label">{label}</div>

      {lineRegions.length > 0 && (
        <div className="layer-image" style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            {lineRegions.map((sub, i) =>
              (sub.selections || [])
                .filter(sel => sel.uri)
                .map((sel, j) => (
                  <CroppedLineImage
                    key={`${i}-${j}`}
                    src={`/api/images/${sel.uri}`}
                    sel={sel}
                    color={LINE_COLORS[i % LINE_COLORS.length]}
                    label={sub.label}
                  />
                ))
            )}
          </div>
        </div>
      )}

      {grouping !== 'entry-author-layer' ? (
        /* ── Entry → Layer → Author ── */
        <>
          {contentLayers.map(l => {
            const activeRows = byLayer[l.key].filter(r => r.text);
            const extraContribs = contribsByLayer[l.key] || [];
            if (activeRows.length === 0 && extraContribs.length === 0) return null;
            return (
              <OmenLayerGroup key={l.key}
                l={l} activeRows={activeRows} extraContribs={extraContribs}
                omenSeq={omenSeq} sources={sources} editProps={editProps}
              />
            );
          })}
          {morphs.length > 0 && (() => {
            const morphColor = colorMap[String(firstSet?.source_id)] || COLOR_SLOTS[0];
            const morphLineKey = `${omenSeq}-morph-${firstSet?.source_id}`;
            const morphSourceLabel = srcLabel(sources[String(firstSet?.source_id)], String(firstSet?.source_id));
            return (
              <div className="v2-layer-row-group layer-morph-transcr layer-morph-gloss"
                style={{ borderLeftColor: morphColor.border }}>
                <span className="v2-layer-row-label">Morph.</span>
                <div className="v2-layer-authors">
                  <EditableMorphLine
                    lineKey={morphLineKey}
                    sourceId={String(firstSet?.source_id)}
                    color={morphColor}
                    morphs={morphs}
                    sourceLabel={morphSourceLabel}
                    editProps={editProps}
                  />
                </div>
              </div>
            );
          })()}
        </>
      ) : (
        /* Group by Author */
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
                const entry = contentByLayer[l.key];
                if (!entry) return null;
                return (
                  <div key={l.key} className={`v2-layer-row-group author-block-row ${l.cls}`}>
                    <span className="v2-layer-row-label">{l.label}</span>
                    <EditableText
                      lineKey={`${omenSeq}-${srcId}-${l.key}`}
                      sourceId={srcId}
                      layerKey={l.key}
                      layerLabel={l.label}
                      sourceLabel={author}
                      color={color}
                      rawText={entry.text}
                      editProps={editProps}
                      className={`v2-layer-text v2-text-${l.key}`}
                      dir={entry.dir || undefined}
                    />
                  </div>
                );
              })}
              {isMorphAuthor && morphs.length > 0 && (
                <div className="v2-layer-row-group author-block-row layer-morph-transcr layer-morph-gloss">
                  <span className="v2-layer-row-label">Morph.</span>
                  <div className="v2-layer-authors">
                    <EditableMorphLine
                      lineKey={`${omenSeq}-morph-${firstSet?.source_id}`}
                      sourceId={String(firstSet?.source_id)}
                      color={colorMap[String(firstSet?.source_id)] || COLOR_SLOTS[0]}
                      morphs={morphs}
                      sourceLabel={srcLabel(sources[String(firstSet?.source_id)], String(firstSet?.source_id))}
                      editProps={editProps}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

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
        {badge && <span className="grouping-badge">{badge}</span>}
      </div>
    </div>
  );
}

// Layer -> Entry -> Author  or  Layer -> Author -> Entry
function LayerFirstView({ grouping, sets, sources, sourceIds, colorMap, editProps }) {
  const contentLayers = LAYERS.filter(l => !l.isMorph);
  const omenSeqs = [...new Set(sets.map(s => s.seq))].sort((a, b) => a - b);

  return contentLayers.map(layer => {
    const layerKey = layer.key;
    const getContent = set => {
      const c = (set.contents || []).find(c => contentTypeToLayer(c.type) === layerKey);
      return c ? { text: c.text, dir: c.text_direction || null } : null;
    };

    if (grouping === 'layer-entry-author') {
      // Layer → Entry → Author: for each layer, entries in order, authors stacked within
      const hasAny = omenSeqs.some(seq =>
        sets.filter(s => s.seq === seq).some(s => getContent(s))
      );
      if (!hasAny) return null;
      return (
        <div key={layerKey} className={`layer-section ${layer.cls}`}>
          <div className="layer-section-header">{layer.label}</div>
          {omenSeqs.map(seq => {
            const seqSets = sets.filter(s => s.seq === seq)
              .sort((a, b) => sourceIds.indexOf(String(a.source_id)) - sourceIds.indexOf(String(b.source_id)));
            const rows = seqSets.map(s => ({ sourceId: String(s.source_id), color: colorMap[String(s.source_id)] || COLOR_SLOTS[0], ...getContent(s) })).filter(r => r.text);
            if (!rows.length) return null;
            const entryLabel = seqSets[0]?.type === 'omen' ? `Omen ${seq}` : `Line ${seq}`;
            return (
              <LayerEntryGroup key={seq}
                seq={seq} entryLabel={entryLabel} rows={rows}
                sources={sources} layerKey={layerKey} layerLabel={layer.label}
                editProps={editProps}
              />
            );
          })}
        </div>
      );
    } else {
      // layer-author-entry: Layer -> Author -> Entry
      const hasAny = sourceIds.some(srcId => sets.filter(s => String(s.source_id) === srcId).some(s => getContent(s)));
      if (!hasAny) return null;
      return (
        <div key={layerKey} className={`layer-section ${layer.cls}`}>
          <div className="layer-section-header">{layer.label}</div>
          {sourceIds.map(srcId => {
            const color = colorMap[srcId] || COLOR_SLOTS[0];
            const authorSets = sets.filter(s => String(s.source_id) === srcId).sort((a, b) => a.seq - b.seq);
            const entries = authorSets.map(s => ({ seq: s.seq, type: s.type, ...getContent(s) })).filter(e => e.text);
            if (!entries.length) return null;
            const sourceLabel = srcLabel(sources[srcId], srcId);
            return (
              <div key={srcId} className={`author-block author-${srcId}`} style={{ borderColor: `${color.border}40` }}>
                <div className="author-block-header" style={{ borderLeft: `3px solid ${color.border}`, background: color.bg }}>
                  <span className="author-block-name" style={{ color: color.text }}>{sourceLabel}</span>
                </div>
                {entries.map(e => (
                  <div key={e.seq} className="v2-layer-row-group author-block-row">
                    <span className="v2-layer-row-label">{e.type === 'omen' ? `Omen ${e.seq}` : `Line ${e.seq}`}</span>
                    <EditableText
                      lineKey={`${e.seq}-${srcId}-${layerKey}`}
                      sourceId={srcId}
                      layerKey={layerKey}
                      layerLabel={layer.label}
                      sourceLabel={sourceLabel}
                      color={color}
                      rawText={e.text}
                      editProps={editProps}
                      className={`v2-layer-text v2-text-${layerKey}`}
                      dir={e.dir || undefined}
                    />
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

// Author -> Layer view: one section per author
// grouping='author-layer'      -> Author -> Layer (all entries shown flat under each layer)
// grouping='author-entry-layer' -> Author -> Entry -> Layer (per-entry sub-sections)
function AuthorLayerView({ sets, sources, sourceIds, colorMap, contributions, onAddContribution, grouping, editProps }) {
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
      // Author -> Layer: group all entries under each layer heading
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
              const c = (s.contents || []).find(c => contentTypeToLayer(c.type) === l.key);
              return c ? [{ seq: s.seq, type: s.type, text: c.text, dir: c.text_direction || null }] : [];
            });
            if (!entries.length) return null;
            return (
              <div key={l.key} className={`v2-layer-row-group author-block-row ${l.cls}`}>
                <span className="v2-layer-row-label">{l.label}</span>
                <div className="v2-layer-authors">
                  {entries.map(e => (
                    <div key={e.seq} className="author-line-flat">
                      <span className="entry-seq-tag">{e.seq}.</span>
                      <EditableText
                        lineKey={`${e.seq}-${srcId}-${l.key}`}
                        sourceId={srcId}
                        layerKey={l.key}
                        layerLabel={l.label}
                        sourceLabel={author}
                        color={color}
                        rawText={e.text}
                        editProps={editProps}
                        className={`v2-layer-text v2-text-${l.key}`}
                        dir={e.dir || undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {morphs.length > 0 && (
            <div className="v2-layer-row-group author-block-row layer-morph-transcr layer-morph-gloss">
              <span className="v2-layer-row-label">Morph.</span>
              <div className="v2-layer-authors">
                <EditableMorphLine
                  lineKey={`0-morph-${srcId}`}
                  sourceId={srcId}
                  color={color}
                  morphs={morphs}
                  sourceLabel={author}
                  editProps={editProps}
                />
              </div>
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
            if (lk && !contentByLayer[lk]) contentByLayer[lk] = { text: c.text, dir: c.text_direction || null };
          });
          const morphs = isMorphAuthor ? (set.morphs || []) : [];
          const hasAny = contentLayers.some(l => contentByLayer[l.key]) || morphs.length > 0;
          if (!hasAny) return null;

          return (
            <div key={set.id} className="author-section-entry">
              <div className="author-section-entry-label">{label}</div>
              {contentLayers.map(l => {
                const entry = contentByLayer[l.key];
                if (!entry) return null;
                return (
                  <div key={l.key} className={`v2-layer-row-group author-block-row ${l.cls}`}>
                    <span className="v2-layer-row-label">{l.label}</span>
                    <EditableText
                      lineKey={`${set.seq}-${srcId}-${l.key}`}
                      sourceId={srcId}
                      layerKey={l.key}
                      layerLabel={l.label}
                      sourceLabel={author}
                      color={color}
                      rawText={entry.text}
                      editProps={editProps}
                      className={`v2-layer-text v2-text-${l.key}`}
                      dir={entry.dir || undefined}
                    />
                  </div>
                );
              })}
              {morphs.length > 0 && (
                <div className="v2-layer-row-group author-block-row layer-morph-transcr layer-morph-gloss">
                  <span className="v2-layer-row-label">Morph.</span>
                  <div className="v2-layer-authors">
                    <EditableMorphLine
                      lineKey={`${set.seq}-morph-${srcId}`}
                      sourceId={srcId}
                      color={color}
                      morphs={morphs}
                      sourceLabel={author}
                      editProps={editProps}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  });
}

// Legend bar maps color dot to author name, shown only when >1 author active
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

const THUMB_VISIBLE = 3;

function ManuscriptPanel({ artifact }) {
  const [activeImgObj, setActiveImgObj] = useState(null);
  const [fullscreen, setFullscreen]     = useState(false);
  const [thumbOffset, setThumbOffset]   = useState(0);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const { data: groups } = useFetch(`/api/artifacts/${artifact.shortname}/image_groups`);
  const groupList = Array.isArray(groups) ? groups : [];

  const activeGroup = groupList.find(g => g.id === activeGroupId) || groupList[0] || null;
  const allImgs = activeGroup?.images || [];

  const switchGroup = g => {
    setActiveGroupId(g.id);
    setActiveImgObj((g.images || [])[0] || null);
    setThumbOffset(0);
  };

  const currentImgObj = activeImgObj || allImgs[0] || null;
  const currentImgSrc = currentImgObj ? `/api/images/${currentImgObj.uri}` : null;
  const currentIdx    = allImgs.findIndex(img => img.id === currentImgObj?.id);

  const { data: rawSelections } = useFetch(
    currentImgObj ? `/api/images/${currentImgObj.id}/selections` : null
  );
  const selections = Array.isArray(rawSelections) ? rawSelections : [];

  const maxOffset  = Math.max(0, allImgs.length - THUMB_VISIBLE);
  const canLeft    = thumbOffset > 0;
  const canRight   = thumbOffset < maxOffset;
  const visibleImgs = allImgs.slice(thumbOffset, thumbOffset + THUMB_VISIBLE);

  const goLeft  = () => setThumbOffset(o => Math.max(0, o - 1));
  const goRight = () => setThumbOffset(o => Math.min(maxOffset, o + 1));

  const canPrev = currentIdx > 0;
  const canNext = currentIdx < allImgs.length - 1;
  const goPrev = () => {
    if (!canPrev) return;
    const newIdx = currentIdx - 1;
    setActiveImgObj(allImgs[newIdx]);
    setThumbOffset(o => Math.min(o, newIdx));
  };
  const goNext = () => {
    if (!canNext) return;
    const newIdx = currentIdx + 1;
    setActiveImgObj(allImgs[newIdx]);
    setThumbOffset(o => Math.max(o, newIdx - THUMB_VISIBLE + 1));
  };

  const arrowBase = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 4, fontSize: 18, color: 'var(--text-tertiary, #999)',
    lineHeight: 1, flexShrink: 0,
  };

  return (
    <>
      {fullscreen && currentImgSrc && (
        <div className="img-fullscreen-overlay" onClick={() => setFullscreen(false)}>
          <img src={currentImgSrc} alt={artifact.label} className="img-fullscreen-img" onClick={e => e.stopPropagation()} />
          <button className="img-fullscreen-close" onClick={() => setFullscreen(false)}>✕</button>
        </div>
      )}
      <div className="v2-manuscript-panel">
        <div className="v2-panel-header">Manuscript</div>
        {groupList.length > 1 && (
          <div style={{ display: 'flex', gap: 2, padding: '0 8px', flexWrap: 'wrap' }}>
            {groupList.map(g => {
              const isActive = g.id === activeGroup?.id;
              return (
                <button
                  key={g.id}
                  onClick={() => switchGroup(g)}
                  style={{
                    background: 'none', border: 'none',
                    borderBottom: isActive ? '1.5px solid #C9A84C' : '1.5px solid transparent',
                    padding: '3px 8px', fontSize: 11, cursor: 'pointer',
                    color: isActive ? 'var(--text-primary, #222)' : 'var(--text-secondary, #666)',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        )}
        {currentImgSrc
          ? (
            <div className="img-wrapper" style={{ position: 'relative' }}>
              <img className="v2-manuscript-img" src={currentImgSrc} alt={artifact.label}
                style={{ display: 'block', width: '100%' }}
                onError={e => { e.target.style.display = 'none'; }} />
              {selections.map(sel => (
                <div key={sel.id} style={{
                  position: 'absolute',
                  top:    `${sel.top    * 100}%`,
                  left:   `${sel.left   * 100}%`,
                  width:  `${sel.width  * 100}%`,
                  height: `${sel.height * 100}%`,
                  pointerEvents: 'none',
                }} />
              ))}
              <button className="img-fullscreen-btn" onClick={() => setFullscreen(true)} title="Fullscreen">⛶</button>
            </div>
          )
          : <div className="v2-img-placeholder">No image available</div>
        }

        {allImgs.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 2px' }}>
            <button
              onClick={goPrev}
              style={{
                background: 'none', border: 'none', padding: '2px 6px',
                fontSize: 13, color: 'var(--text-tertiary, #999)',
                cursor: canPrev ? 'pointer' : 'default',
                opacity: canPrev ? 1 : 0.3,
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              <i className="ti ti-chevron-left" /> Prev
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary, #999)' }}>
              {currentIdx + 1} of {allImgs.length}
            </span>
            <button
              onClick={goNext}
              style={{
                background: 'none', border: 'none', padding: '2px 6px',
                fontSize: 13, color: 'var(--text-tertiary, #999)',
                cursor: canNext ? 'pointer' : 'default',
                opacity: canNext ? 1 : 0.3,
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              Next <i className="ti ti-chevron-right" />
            </button>
          </div>
        )}

        {allImgs.length > 1 && (
          <div style={{ marginTop: 6, padding: '0 8px' }}>
            {/* arrow · thumbnails · arrow */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={goLeft}
                style={{
                  background: 'none', border: 'none', padding: '0 4px',
                  fontSize: 16, color: 'var(--text-tertiary, #999)',
                  cursor: canLeft ? 'pointer' : 'default',
                  opacity: canLeft ? 1 : 0.3,
                  pointerEvents: canLeft ? 'auto' : 'none',
                  flexShrink: 0, lineHeight: 1,
                }}
                onMouseEnter={e => { if (canLeft) e.currentTarget.style.color = 'var(--text-primary, #222)'; }}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary, #999)'}
              >
                <i className="ti ti-chevron-left" />
              </button>

              {/* thumbnail row — flex:1 + overflow:hidden keeps exactly 3 visible */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 6 }}>
                {visibleImgs.map(img => (
                  <img
                    key={img.id}
                    src={`/api/images/${img.uri}`}
                    alt=""
                    onClick={() => setActiveImgObj(img)}
                    onError={e => { e.target.style.display = 'none'; }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: 56,
                      objectFit: 'cover',
                      borderRadius: 'var(--border-radius-md, 4px)',
                      border: img.id === currentImgObj?.id
                        ? '1.5px solid #C9A84C'
                        : '0.5px solid var(--border-tertiary, #ddd)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={goRight}
                style={{
                  background: 'none', border: 'none', padding: '0 4px',
                  fontSize: 16, color: 'var(--text-tertiary, #999)',
                  cursor: canRight ? 'pointer' : 'default',
                  opacity: canRight ? 1 : 0.3,
                  pointerEvents: canRight ? 'auto' : 'none',
                  flexShrink: 0, lineHeight: 1,
                }}
                onMouseEnter={e => { if (canRight) e.currentTarget.style.color = 'var(--text-primary, #222)'; }}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary, #999)'}
              >
                <i className="ti ti-chevron-right" />
              </button>
            </div>

          </div>
        )}
      </div>
    </>
  );
}

function DetailsPanel({ artifact, sources, sourceIds, colorMap, editLog, lineOverrides, onUndoEdit, onFlagEdit, onViewInText, onRestore, activeTab, onTabChange, historyFilter, onClearHistoryFilter }) {
  const tab = activeTab;
  const setTab = onTabChange;
  return (
    <div className="v2-details-panel">
      <div className="detail-tab-bar">
        <button className={`detail-tab${tab === 'details' ? ' active' : ''}`} onClick={() => setTab('details')}>Details</button>
        <button className={`detail-tab${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>
          History {editLog?.length > 0 && <span className="edit-log-count">{editLog.length}</span>}
        </button>
      </div>
      {tab === 'details' ? (
        <div style={{ flex:1, overflowY:'auto', padding:'1rem 1.1rem' }}>
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
      ) : (
        <EditHistoryPanel
          editLog={editLog || []}
          lineOverrides={lineOverrides || {}}
          onUndo={onUndoEdit}
          onFlag={onFlagEdit}
          onViewInText={onViewInText}
          onRestore={onRestore}
          colorMap={colorMap}
          sources={sources}
          sourceIds={sourceIds}
          historyFilter={historyFilter}
          onClearHistoryFilter={onClearHistoryFilter}
        />
      )}
    </div>
  );
}


function MinimalToolbar({ sourceIds, sources, hiddenAuthors, onToggleAuthor, hiddenLayers, onToggleLayer, grouping, onGroupingChange, colorMap }) {
  const [openPopover, setOpenPopover] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpenPopover(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const layerItems = [
    { key: 'script',        label: 'Script',          short: 'Script' },
    { key: 'translit',      label: 'Transliteration', short: 'Translit.' },
    { key: 'transcription', label: 'Transcription',   short: 'Transcr.' },
    { key: 'translation',   label: 'Translation',     short: 'Transl.' },
    { key: 'morph',         label: 'Morphology',      short: 'Morph.' },
    { key: 'image',         label: 'Image',            short: 'Image' },
  ];

  const isLayerOn = key => key === 'morph'
    ? !hiddenLayers.has('morph-transcr') && !hiddenLayers.has('morph-gloss')
    : !hiddenLayers.has(key);

  const toggleLayer = key => {
    if (key === 'morph') { onToggleLayer('morph-transcr'); onToggleLayer('morph-gloss'); }
    else onToggleLayer(key);
  };

  const [first, second] = GROUPING_MODES[grouping] || ['entry', 'layer', 'author'];
  const secondOpts = SECOND_OPTS[first];
  const third = GROUPING_MODES[grouping]?.[2];

  const setFirst = v => {
    const newOpts = SECOND_OPTS[v];
    const newSecond = newOpts.includes(second) ? second : newOpts[0];
    onGroupingChange(resolveMode(v, newSecond));
  };
  const setSecond = v => onGroupingChange(resolveMode(first, v));

  const activeAuthorIds = sourceIds.filter(id => !hiddenAuthors.has(id));
  const activeLayerItems = layerItems.filter(l => isLayerOn(l.key));

  return (
    <div className="mtb-toolbar" ref={ref}>
      {/* Row 1 — Authors */}
      <div className="mtb-row">
        <span className="mtb-row-label">Authors</span>
        <div className="mtb-row-pills">
          {activeAuthorIds.map(id => {
            const color = colorMap[id] || COLOR_SLOTS[0];
            const src = sources[id];
            const shortName = src
              ? (src.date_published ? `${src.author.split(' ').pop()} ${src.date_published}` : src.author.split(' ').pop())
              : `Source ${id}`;
            return (
              <span key={id} className="mtb-pill" style={{ borderColor: color.border }}>
                <span className="mtb-dot" style={{ color: color.border }}>●</span>
                {shortName}
                <button className="mtb-pill-x" onClick={() => onToggleAuthor(id)}>✕</button>
              </span>
            );
          })}
          <div className="mtb-add-wrap">
            <button
              className={`mtb-add-btn${openPopover === 'authors' ? ' mtb-open' : ''}`}
              onClick={() => setOpenPopover(p => p === 'authors' ? null : 'authors')}
            >
              +
            </button>
            {openPopover === 'authors' && (
              <div className="mtb-popover">
                {sourceIds.map(id => {
                  const color = colorMap[id] || COLOR_SLOTS[0];
                  const src = sources[id];
                  const selected = !hiddenAuthors.has(id);
                  const label = src
                    ? (src.date_published ? `${src.author.split(' ').pop()} ${src.date_published}` : src.author.split(' ').pop())
                    : `Source ${id}`;
                  return (
                    <div
                      key={id}
                      className={`mtb-pop-row${selected ? ' mtb-selected' : ''}`}
                      onClick={() => onToggleAuthor(id)}
                    >
                      <span className="mtb-dot" style={{ color: color.border }}>●</span>
                      <span className="mtb-pop-label">{label}</span>
                      {selected && <i className="ti ti-check mtb-check" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 — Layers */}
      <div className="mtb-row">
        <span className="mtb-row-label">Layers</span>
        <div className="mtb-row-pills">
          {activeLayerItems.map(l => (
            <span key={l.key} className="mtb-pill">
              {l.short}
              <button className="mtb-pill-x" onClick={() => toggleLayer(l.key)}>✕</button>
            </span>
          ))}
          <div className="mtb-add-wrap">
            <button
              className={`mtb-add-btn${openPopover === 'layers' ? ' mtb-open' : ''}`}
              onClick={() => setOpenPopover(p => p === 'layers' ? null : 'layers')}
            >
              +
            </button>
            {openPopover === 'layers' && (
              <div className="mtb-popover">
                {layerItems.map(l => {
                  const selected = isLayerOn(l.key);
                  return (
                    <div
                      key={l.key}
                      className={`mtb-pop-row${selected ? ' mtb-selected' : ''}`}
                      onClick={() => toggleLayer(l.key)}
                    >
                      <span className="mtb-pop-label">{l.label}</span>
                      {selected && <i className="ti ti-check mtb-check" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3 — Group by */}
      <div className="mtb-row mtb-row-group">
        <span className="mtb-row-label">Group</span>
        <div className="mtb-group-segs">
          <div className="seg-ctrl">
            {['author', 'entry', 'layer'].map(v => (
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

  // Selections live nested under set.contents[].divisions[].selections already
  // (each carries its own image uri), so build the line-region map straight off
  // `sets` instead of depending on a `page`-type division existing for this
  // artifact — many artifacts (e.g. Memorial 118) only have `line` divisions.
  const lineRegionsByContentId = {};
  sets.forEach(set => {
    (set.contents || []).forEach(c => {
      (c.divisions || []).forEach(div => {
        if (!div.selections || div.selections.length === 0) return;
        const cid = div.start_content_id;
        if (!lineRegionsByContentId[cid]) lineRegionsByContentId[cid] = [];
        lineRegionsByContentId[cid].push(div);
      });
    });
  });
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

  const [contributions, setContributions]   = useState({});
  const [lineOverrides, setLineOverrides]   = useState({});
  const [editLog, setEditLog]               = useState([]);
  const [activeEditor, setActiveEditor]     = useState(null);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [rightTab, setRightTab]             = useState('details');
  const [historyFilter, setHistoryFilter]   = useState(null);

  // Non-stale refs for use inside callbacks
  const editLogRef      = useRef(editLog);
  editLogRef.current    = editLog;

  const openEditor = useCallback((lineKey, info) => {
    setActiveEditor({ lineKey, ...info });
  }, []);

  const closeEditor = useCallback(() => setActiveEditor(null), []);

  const submitEdit = useCallback((lineKey, newText, contributor, info) => {
    const parts = lineKey.split('-');
    const omenSeqN = parseInt(parts[0]);
    const omenLabel = `Entry ${omenSeqN}`;
    setLineOverrides(prev => {
      const originalText = prev[lineKey] ?? info.originalText ?? '';
      setEditLog(log => [{
        id: Date.now(),
        lineKey, omenLabel,
        layerLabel: info.layerLabel, layerKey: info.layerKey,
        sourceLabel: info.sourceLabel,
        omenSeq: omenSeqN,
        originalText,
        newText,
        contributor: contributor || 'anonymous',
        flagged: false, isUndo: false,
      }, ...log]);
      return { ...prev, [lineKey]: newText };
    });
    setActiveEditor(null);
  }, []);

  const undoEdit = useCallback((logEntry) => {
    setLineOverrides(prev => ({ ...prev, [logEntry.lineKey]: logEntry.originalText }));
    setEditLog(prev => [{
      id: Date.now(), ...logEntry,
      isUndo: true,
      originalText: logEntry.newText,
      newText: logEntry.originalText,
      contributor: 'you', flagged: false,
    }, ...prev]);
  }, []);

  const flagEdit = useCallback((id) => {
    setEditLog(prev => prev.map(e => e.id === id ? { ...e, flagged: !e.flagged } : e));
  }, []);

  const viewInText = useCallback((logEntry) => {
    const el = document.getElementById(`omen-${logEntry.omenSeq}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedLine(logEntry.lineKey);
    setTimeout(() => setHighlightedLine(null), 2000);
  }, []);

  const openHistory = useCallback((lineKey, meta) => {
    setRightTab('history');
    if (!lineKey) { setHistoryFilter(null); return; }
    const entryLabel = `Entry ${parseInt(lineKey.split('-')[0])}`;
    setHistoryFilter(prev => prev?.lineKey === lineKey ? null : { lineKey, entryLabel, ...meta });
  }, []);

  const restoreVersion = useCallback((lineKey, newText) => {
    const entry = editLogRef.current.find(e => e.lineKey === lineKey);
    if (!entry) return;
    submitEdit(lineKey, newText, 'restored', {
      sourceLabel: entry.sourceLabel,
      layerLabel:  entry.layerLabel,
      layerKey:    entry.layerKey,
    });
  }, [submitEdit]);

  const editProps = { lineOverrides, activeEditor, highlightedLine, openEditor, closeEditor, submitEdit, openHistory };

  const [leftW,  setLeftW]  = useState(240);
  const [rightW, setRightW] = useState(280);

  const startDrag = useCallback((side, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = side === 'left' ? leftW : rightW;
    const setter  = side === 'left' ? setLeftW : setRightW;
    const min = side === 'left' ? 120 : 200;
    const max = side === 'left' ? 520 : 520;
    const sign = side === 'left' ? 1 : -1;
    const onMove = ev => setter(Math.max(min, Math.min(max, startW + sign * (ev.clientX - startX))));
    const onUp   = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [leftW, rightW]);

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

  const activeSourceIds = sourceIds.filter(id => !hiddenAuthors.has(id));
  const isSingleAuthor = activeSourceIds.length === 1;
  const activeSets = sets.filter(s => !hiddenAuthors.has(String(s.source_id)));
  const omenSeqs = [...new Set(activeSets.map(s => s.seq))].sort((a, b) => a - b);

  const hideClasses = [
    ...[...hiddenLayers].map(k => `hide-layer-${k}`),
    isSingleAuthor ? 'single-author' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="v2-viewer-layout" style={{ gridTemplateColumns: `${leftW}px 4px 1fr 4px ${rightW}px` }}>
      <ManuscriptPanel artifact={artifact} />
      <div className="v2-resize-handle" onMouseDown={e => startDrag('left', e)} />

      <div className="v2-center-panel">
        <MinimalToolbar
          sourceIds={sourceIds}
          sources={sources}
          hiddenAuthors={hiddenAuthors}
          onToggleAuthor={toggleAuthor}
          hiddenLayers={hiddenLayers}
          onToggleLayer={toggleLayer}
          grouping={grouping}
          onGroupingChange={setGrouping}
          colorMap={colorMap}
        />

        <div className={`v2-text-display ${hideClasses}`}>
          {(grouping === 'author-layer' || grouping === 'author-entry-layer') ? (
            <AuthorLayerView
              sets={activeSets} sources={sources} sourceIds={activeSourceIds}
              colorMap={colorMap} contributions={contributions} onAddContribution={addContribution}
              grouping={grouping} editProps={editProps}
            />
          ) : (grouping === 'layer-entry-author' || grouping === 'layer-author-entry') ? (
            <LayerFirstView
              grouping={grouping} sets={activeSets} sources={sources}
              sourceIds={activeSourceIds} colorMap={colorMap} editProps={editProps}
            />
          ) : (
            omenSeqs.map(seq => {
              const seqSets = activeSets
                .filter(s => s.seq === seq)
                .sort((a, b) => sourceIds.indexOf(String(a.source_id)) - sourceIds.indexOf(String(b.source_id)));
              const seqSetsBySource = sets
                .filter(s => s.seq === seq)
                .sort((a, b) => sourceIds.indexOf(String(a.source_id)) - sourceIds.indexOf(String(b.source_id)));
              // Every source that has image selections for this line should
              // show its crop, not just the first one found.
              const lineContentIds = seqSetsBySource
                .map(s => s.contents?.[0]?.id)
                .filter(cid => cid && lineRegionsByContentId[cid]);
              const canonicalFirstContentId = lineContentIds[0]
                ?? seqSetsBySource[0]?.contents?.[0]?.id
                ?? null;
              return (
                <OmenBlock
                  key={seq} omenSeq={seq} omenType={seqSets[0]?.type || 'omen'}
                  sets={seqSets} sources={sources} colorMap={colorMap}
                  contributions={contributions} onAddContribution={addContribution}
                  grouping={grouping} editProps={editProps}
                  lineRegionsByContentId={lineRegionsByContentId}
                  lineContentIds={lineContentIds}
                  canonicalFirstContentId={canonicalFirstContentId}
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

      <div className="v2-resize-handle" onMouseDown={e => startDrag('right', e)} />
      <DetailsPanel artifact={artifact} sources={sources} sourceIds={sourceIds} colorMap={colorMap}
        editLog={editLog} lineOverrides={lineOverrides}
        onUndoEdit={undoEdit} onFlagEdit={flagEdit} onViewInText={viewInText} onRestore={restoreVersion}
        activeTab={rightTab} onTabChange={setRightTab}
        historyFilter={historyFilter} onClearHistoryFilter={() => setHistoryFilter(null)} />
    </div>
  );
}
