import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import IconButton from '../common/IconButton';
import Pill from '../common/Pill';
import AddPopover from '../common/AddPopover';
import { useAuth } from '../../Auth/AuthContext';
import { apiUrl } from '../../config';


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
  { key: 'script',        label: 'Script',       long: 'Script',          cls: 'layer-script',        isMorph: false },
  { key: 'translit',      label: 'Translit.',    long: 'Transliteration', cls: 'layer-translit',      isMorph: false },
  { key: 'transcription', label: 'Transcr.',     long: 'Transcription',   cls: 'layer-transcription', isMorph: false },
  { key: 'translation',   label: 'Transl.',      long: 'Translation',     cls: 'layer-translation',   isMorph: false },
  { key: 'morph-transcr', label: 'Morph. form',  long: 'Morph. form',     cls: 'layer-morph-transcr', isMorph: true  },
  { key: 'morph-gloss',   label: 'Morph. gloss', long: 'Morph. gloss',    cls: 'layer-morph-gloss',   isMorph: true  },
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

const LANG_LABELS = { eng: 'English', rus: 'Russian', tur: 'Turkish', kaz: 'Kazakh', hun: 'Hungarian' };
const UNSPECIFIED_LANG = '__unspecified__';

function extractLangCode(type) {
  const m = (type || '').match(/\[([^\]]+)\]/);
  return m ? m[1] : null;
}
function contentLangLabel(type) {
  const code = extractLangCode(type);
  return code ? (LANG_LABELS[code] || code) : null;
}

function contentLangShort(type) {
  return extractLangCode(type);
}

function translationLangLabel(code) {
  return code === UNSPECIFIED_LANG ? 'Unspecified language' : (LANG_LABELS[code] || code);
}

// Splits a flat list of translation rows (each carrying a `contentType`) into
// language-first groups -- known languages sorted alphabetically by label,
// entries with no language tag collected last under "Unspecified language".
function groupRowsByLanguage(rows) {
  const groups = new Map();
  rows.forEach(r => {
    const code = extractLangCode(r.contentType) || UNSPECIFIED_LANG;
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(r);
  });
  const codes = [...groups.keys()].sort((a, b) => {
    if (a === UNSPECIFIED_LANG) return 1;
    if (b === UNSPECIFIED_LANG) return -1;
    return translationLangLabel(a).localeCompare(translationLangLabel(b));
  });
  return codes.map(code => ({ code, label: translationLangLabel(code), rows: groups.get(code) }));
}

function contentTypeToLayer(type) {
  if (type === 'original') return 'script';
  if (type === 'transliteration' || type === 'tranliteration') return 'translit';
  if (type.startsWith('transcription')) return 'transcription';
  if (type.startsWith('translation') || type.startsWith('tranlation')) return 'translation';
  return null;
}


function isLangHidden(type, hiddenLanguages) {
  const lang = extractLangCode(type);
  return !!lang && !!hiddenLanguages?.has(lang);
}


function pickContentsForLayer(contents, layerKey, hiddenLanguages) {
  const matches = (contents || [])
    .filter(c => contentTypeToLayer(c.type) === layerKey && !isLangHidden(c.type, hiddenLanguages))
    .map(c => ({ text: c.text, dir: c.text_direction || null, contentType: c.type }));
  return layerKey === 'translation' ? matches : matches.slice(0, 1);
}



function layerLineKey(seq, sourceId, layerKey, contentType) {
  const langCode = layerKey === 'translation' ? extractLangCode(contentType) : null;
  return `${seq}-${sourceId}-${layerKey}${langCode ? `-${langCode}` : ''}`;
}

function srcLabel(src, id) {
  if (!src) return `Source ${id}`;
  return src.shortname || src.author.split(' ').pop();
}


function setLabel(set, seq, type) {
  return set?.label || (type === 'omen' ? `Omen ${seq}` : `Line ${seq}`);
}

// Some divisions are labeled with a bare number in the database (e.g. "1",
// "2") rather than a descriptive string -- read as "Line 1" etc. instead of
// an unlabeled digit. Non-numeric curated labels pass through untouched.
function divisionLabel(div) {
  if (!div?.label) return div?.type;
  if (/^\d+$/.test(div.label.trim())) {
    const typeName = div.type ? div.type.charAt(0).toUpperCase() + div.type.slice(1) : 'Line';
    return `${typeName} ${div.label.trim()}`;
  }
  return div.label;
}

// One source's outline for the Contents browser: its own sets (top-level
// entries, e.g. "Omen 1") each with the divisions that live underneath them.
function buildSourceOutline(sourceId, sets) {
  const sourceSets = sets
    .filter(s => String(s.source_id) === String(sourceId))
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  return sourceSets.map(set => {
    const seenDivIds = new Set();
    const divisions = [];
    (set.contents || []).forEach(c => {
      (c.divisions || []).forEach(div => {
        if (seenDivIds.has(div.id)) return;
        if (!(div.selections || []).some(s => s.uri)) return;
        seenDivIds.add(div.id);
        divisions.push(div);
      });
    });
    return {
      seq: set.seq,
      label: setLabel(set, set.seq, set.type),
      divisions,
    };
  });
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

function EditableMorphLine({ lineKey, sourceId, color, morphs, sourceLabel, editProps, bare, plain }) {
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
        defaultContributor={editProps.defaultContributor}
        onCancel={editProps.closeEditor}
        onSubmit={(newText, contributor) =>
          editProps.submitEdit(lineKey, newText, contributor, { sourceLabel, layerLabel: 'Morph. analysis', layerKey: 'morph', originalText: isEdited ? overrideText : morphsToText(morphs) })}
      />
    );
  }

  // bare: rendered directly within an author-scoped row (label already identifies the
  // author), so it mirrors EditableText's layout — no dot, no author-line indent.
  if (bare) {
    return (
      <div
        className="editable-text-wrap"
        style={plain ? {
          borderRadius: 2,
          background: hovered ? 'var(--surface-1)' : undefined,
          alignItems: 'flex-start',
          position: 'relative',
        } : {
          outline: hovered && editProps ? `1px solid ${color.border}80` : 'none',
          borderRadius: 2,
          background: hovered && editProps ? color.bg : undefined,
          alignItems: 'flex-start',
          position: 'relative',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {isEdited && <span className="line-edited-dot" />}
        {isEdited
          ? <span className="v2-layer-text">{overrideText}</span>
          : <MorphInterlinear morphs={morphs} />
        }
        {editProps && (
          <div className="line-btn-group">
            <IconButton className="clock-btn" icon="fa-clock"
              onClick={() => editProps.openHistory(lineKey, { sourceLabel, layerLabel: 'Morph. analysis' })} />
            <IconButton className="pencil-btn" icon="fa-pen"
              onClick={() => editProps.canEdit
                ? editProps.openEditor(lineKey, { sourceId, layerKey: 'morph', layerLabel: 'Morph. analysis', sourceLabel })
                : editProps.promptAuth()} />
          </div>
        )}
      </div>
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
          <IconButton className="clock-btn" icon="fa-clock"
            onClick={() => editProps.openHistory(lineKey, { sourceLabel, layerLabel: 'Morph. analysis' })} />
          <IconButton className="pencil-btn" icon="fa-pen"
            onClick={() => editProps.canEdit
              ? editProps.openEditor(lineKey, { sourceId, layerKey: 'morph', layerLabel: 'Morph. analysis', sourceLabel })
              : editProps.promptAuth()} />
        </div>
      )}
    </div>
  );
}

function EditableText({ lineKey, sourceId, layerKey, layerLabel, sourceLabel, color, rawText, contentType, editProps, className, dir, plain }) {
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
        defaultContributor={editProps.defaultContributor}
        onCancel={editProps.closeEditor}
        onSubmit={(newText, contributor) =>
          editProps.submitEdit(lineKey, newText, contributor, { sourceLabel, layerLabel, layerKey, originalText: displayText })}
      />
    );
  }

  const langTip = contentLangLabel(contentType);
  const langCode = layerKey === 'translation' ? contentLangShort(contentType) : null;
  const highlighted = editProps?.highlightedLine === lineKey;
  return (
    <div
      id={`el-${lineKey}`}
      className={`editable-text-wrap${highlighted ? ' line-highlighted' : ''}`}
      title={langTip ? `Language: ${langTip}` : undefined}
      style={plain ? {
        borderRadius: 2,
        background: hovered ? 'var(--surface-1)' : undefined,
        ...(isRtl ? { flexDirection: 'row-reverse' } : {}),
      } : {
        outline: hovered && editProps ? `1px solid ${color.border}80` : 'none',
        borderRadius: 2,
        background: hovered && editProps ? color.bg : undefined,
        ...(isRtl ? { flexDirection: 'row-reverse' } : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isEdited && <span className="line-edited-dot" />}
      {langCode && <span className="v2-lang-badge">{langCode}</span>}
      <span className={className} dir={effectiveDir}>{displayText}</span>
      {editProps && (
        <div className="line-btn-group">
          <IconButton className="clock-btn" icon="fa-clock"
            onClick={() => editProps.openHistory(lineKey, { sourceLabel, layerLabel })} />
          <IconButton className="pencil-btn" icon="fa-pen"
            onClick={() => editProps.canEdit
              ? editProps.openEditor(lineKey, { sourceId, layerKey, layerLabel, sourceLabel })
              : editProps.promptAuth()} />
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

// shown when a logged-out visitor clicks the pencil on a line, everything else
// about the page stays exactly the same for them
function AuthPromptModal({ onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="auth-prompt-overlay" onClick={onClose}>
      <div className="auth-card auth-prompt-card" onClick={e => e.stopPropagation()}>
        <button className="auth-prompt-close" onClick={onClose} aria-label="Close">
          <i className="fas fa-times" />
        </button>
        <div className="auth-card-heading">Sign in to edit</div>
        <div className="auth-card-subtitle">Create a free account to contribute analyses.</div>
        <Link to="/signin" state={{ from: window.location.pathname }} className="auth-submit-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
          Sign in
        </Link>
        <div className="auth-switch">No account? <Link to="/signup">Create one</Link></div>
      </div>
    </div>
  );
}

function InlineEditor({ initialText, color, sourceLabel, layerLabel, dir, onCancel, onSubmit, defaultContributor }) {
  const [text, setText]            = useState(initialText);
  const [contributor, setContrib]  = useState(defaultContributor || '');
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

function EditableLine({ lineKey, sourceId, color, layerKey, text, isEdited, sourceLabel, layerLabel, contentType, editProps, pinProps }) {
  const [hovered, setHovered] = useState(false);
  const isActive    = editProps?.activeEditor?.lineKey === lineKey;
  const highlighted = editProps?.highlightedLine === lineKey;
  const dir         = detectDir(text);
  const isRtl       = layerKey === 'script';
  const langTip     = contentLangLabel(contentType);
  const langCode    = layerKey === 'translation' ? contentLangShort(contentType) : null;

  const isPinned = pinProps?.pinnedKey === lineKey;
  const pinnedLang = pinProps?.pinnedContentType ? extractLangCode(pinProps.pinnedContentType) : null;
  const rowLang    = contentType ? extractLangCode(contentType) : null;
  const langMismatch = pinnedLang && rowLang && pinnedLang !== rowLang;
  const showDiff = pinProps != null && pinProps.pinnedKey != null && !isPinned && !langMismatch;

  if (isActive) {
    return (
      <InlineEditor
        initialText={text} color={color} dir={dir}
        sourceLabel={sourceLabel} layerLabel={layerLabel}
        defaultContributor={editProps.defaultContributor}
        onCancel={editProps.closeEditor}
        onSubmit={(newText, contributor) =>
          editProps.submitEdit(lineKey, newText, contributor, { sourceLabel, layerLabel, layerKey, originalText: text })}
      />
    );
  }

  return (
    <div
      id={`el-${lineKey}`}
      className={`author-line author-${sourceId}${isEdited ? ' line-edited' : ''}${highlighted ? ' line-highlighted' : ''}${pinProps ? ' has-pin' : ''}${pinProps?.pinnedKey != null ? ' line-dimmed' : ''}`}
      title={langTip ? `Language: ${langTip}` : undefined}
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
      {langCode && <span className="v2-lang-badge">{langCode}</span>}
      {showDiff
        ? <InlineDiff refText={pinProps.pinnedText} otherText={text} layerKey={layerKey} dir={dir} />
        : <span className={`v2-layer-text v2-text-${layerKey}`} dir={dir}>{text}</span>
      }
      {langMismatch && pinProps?.pinnedKey != null && (
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted, #aaa)', fontStyle: 'italic', marginLeft: '0.4rem', flexShrink: 0 }}>
          ({langTip || 'diff. lang'})
        </span>
      )}
      {isPinned && <span className="ref-tag">ref</span>}
      {(pinProps || editProps) && (
        <div className="line-btn-group">
          {pinProps && (
            <IconButton className={`pin-btn${isPinned ? ' pin-btn-active' : ''}`} icon="fa-thumbtack"
              onClick={() => pinProps.onPin(lineKey)} />
          )}
          {editProps && (
            <IconButton className="clock-btn" icon="fa-clock"
              onClick={() => editProps.openHistory(lineKey, { sourceLabel, layerLabel })} />
          )}
          {editProps && (
            <IconButton className="pencil-btn" icon="fa-pen"
              onClick={() => editProps.canEdit
                ? editProps.openEditor(lineKey, { sourceId, layerKey, layerLabel, sourceLabel })
                : editProps.promptAuth()} />
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

function OmenLayerGroup({ l, activeRows, omenSeq, sources, editProps, groupByLanguage }) {
  const [pinnedKey, setPinnedKey] = useState(null);
  const hasMultiple = activeRows.length > 1;

  const rowsWithKey = activeRows.map(r => {
    const lKey        = layerLineKey(omenSeq, r.sourceId, l.key, r.contentType);
    const currentText = editProps?.lineOverrides?.[lKey] ?? r.text;
    const isEdited     = lKey in (editProps?.lineOverrides || {});
    return { ...r, lKey, text: currentText, isEdited };
  });

  const pinnedRow          = pinnedKey ? rowsWithKey.find(r => r.lKey === pinnedKey) : null;
  const pinnedText         = pinnedRow?.text ?? null;
  const pinnedContentType  = pinnedRow?.contentType ?? null;
  const pinProps           = hasMultiple
    ? { pinnedKey, pinnedText, pinnedContentType, onPin: lk => setPinnedKey(k => k === lk ? null : lk) }
    : null;

  const renderLine = r => (
    <EditableLine key={r.lKey}
      lineKey={r.lKey} sourceId={r.sourceId} color={r.color}
      layerKey={l.key} text={r.text}
      isEdited={r.isEdited}
      contentType={r.contentType}
      sourceLabel={srcLabel(sources[r.sourceId], r.sourceId)}
      layerLabel={l.label}
      editProps={editProps}
      pinProps={pinProps}
    />
  );

  return (
    <div className={`v2-layer-group-wrap ${l.cls}`}>
      <div className="v2-layer-row-group v2-layer-row-group--inner">
        <div className="v2-layer-label-cell">
          <span className="v2-layer-row-label">{l.label}</span>
        </div>
        <div className="v2-layer-authors">
          {groupByLanguage
            ? groupRowsByLanguage(rowsWithKey).map(g => (
                <div key={g.code} className="v2-translation-lang-group">
                  <span className="v2-translation-lang-header">{g.label}</span>
                  {g.rows.map(renderLine)}
                </div>
              ))
            : rowsWithKey.map(renderLine)
          }
        </div>
      </div>
    </div>
  );
}

function LayerEntryGroup({ seq, entryLabel, rows, sources, layerKey, layerLabel, editProps }) {
  const [pinnedKey, setPinnedKey] = useState(null);
  const hasMultiple = rows.length > 1;

  const rowsWithKey = rows.map(r => {
    const lKey        = layerLineKey(seq, r.sourceId, layerKey, r.contentType);
    const currentText = editProps?.lineOverrides?.[lKey] ?? r.text;
    const isEdited     = lKey in (editProps?.lineOverrides || {});
    return { ...r, lKey, text: currentText, isEdited };
  });

  const pinnedRow         = pinnedKey ? rowsWithKey.find(r => r.lKey === pinnedKey) : null;
  const pinnedText        = pinnedRow?.text ?? null;
  const pinnedContentType = pinnedRow?.contentType ?? null;
  const pinProps          = hasMultiple
    ? { pinnedKey, pinnedText, pinnedContentType, onPin: lk => setPinnedKey(k => k === lk ? null : lk) }
    : null;

  return (
    <div className="layer-section-entry">
      <div className="layer-section-entry-label-wrap">
        <div className="layer-section-entry-label">{entryLabel}</div>
      </div>
      {rowsWithKey.map(r => (
        <EditableLine key={r.lKey}
          lineKey={r.lKey} sourceId={r.sourceId} color={r.color}
          layerKey={layerKey} text={r.text}
          isEdited={r.isEdited}
          contentType={r.contentType}
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

function CroppedLineImage({ src, sel, color, label, maxW }) {
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
  const maxDisplayW = maxW ?? 220, maxDisplayH = 50;
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

function ResizableCrop({ src, sel, color, label }) {
  const [w, setW] = useState(220);
  const [hovered, setHovered] = useState(false);

  const startDrag = e => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = w;
    // track mouse globally so dragging outside the element still works
    const onMove = ev => setW(Math.max(80, Math.min(480, startW + ev.clientX - startX)));
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CroppedLineImage src={src} sel={sel} color={color} label={label} maxW={w} />
      {/* corner resize icon that only shows on hover */}
      <i
        className="fas fa-expand-arrows-alt"
        onMouseDown={startDrag}
        style={{
          position: 'absolute', bottom: 4, right: 4,
          fontSize: 13, cursor: 'nwse-resize',
          color: hovered ? '#333' : '#999',
          opacity: hovered ? 0.85 : 0.35,
          transition: 'opacity 0.15s, color 0.15s',
          userSelect: 'none',
          zIndex: 10,
        }}
      />
    </div>
  );
}

// Line-crop image selections for a single content set, keyed by its script content id.
function getImgSels(set, lineRegionsByContentId) {
  const cid = set.contents?.[0]?.id;
  const regions = lineRegionsByContentId ? (lineRegionsByContentId[cid] || []) : [];
  return regions.flatMap(r => (r.selections || []).filter(s => s.uri));
}

// A set's reading direction, taken from its script (original) layer's text_direction.
function getSetDir(set) {
  const script = (set.contents || []).find(c => contentTypeToLayer(c.type) === 'script');
  return script?.text_direction?.toLowerCase() === 'rtl' ? 'rtl' : 'ltr';
}


function ImageCropRow({ color, sels, dir, bare, style }) {
  if (!sels || sels.length === 0) return null;
  const isRtl = dir === 'rtl';
  return (
    <div style={{
      display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10,
      direction: isRtl ? 'rtl' : 'ltr',
      alignItems: 'flex-start',
      // In `bare` mode this row sits as a flex item next to a row-label sibling
      // (e.g. the "IMAGE" label) rather than stretching to fill the row itself,
      // so `direction: rtl` alone only reorders the crops relative to each other --
      // it doesn't move the whole cluster to the row's right edge. Pull it there
      // explicitly so RTL entries read right-to-left like their sibling text rows.
      ...(bare ? { marginLeft: isRtl ? 'auto' : undefined } : { borderLeft: `2px solid ${color.border}`, paddingLeft: 8, marginLeft: -8 }),
      ...style,
    }}>
      {sels.map((sel, j) => (
        <ResizableCrop key={j} src={apiUrl(`/api/images/${sel.uri}`)} sel={sel} color={color} label={sel.label || ''} />
      ))}
    </div>
  );
}

// Unified omen block supports entry-layer-author and entry-author-layer grouping modes.
function OmenBlock({ omenSeq, omenType, sets, sources, colorMap, grouping, editProps, lineRegionsByContentId, hiddenLanguages, groupTranslationsByLanguage }) {
  const firstSet = sets[0];
  const label = setLabel(firstSet, omenSeq, omenType);
  const morphs = firstSet?.morphs || [];
  const contentLayers = LAYERS.filter(l => !l.isMorph);

  // Build both structures up front
  const byLayer = {};
  contentLayers.forEach(l => { byLayer[l.key] = []; });
  const bySrc = {};
  sets.forEach(set => {
    const color = colorMap[String(set.source_id)] || COLOR_SLOTS[0];
    const contentsByLayer = {};
    contentLayers.forEach(l => {
      const entries = pickContentsForLayer(set.contents, l.key, hiddenLanguages);
      contentsByLayer[l.key] = entries;
      if (entries.length === 0) {
        byLayer[l.key].push({ sourceId: String(set.source_id), color, text: null, dir: null, contentType: null });
      } else {
        entries.forEach(entry => {
          byLayer[l.key].push({ sourceId: String(set.source_id), color, text: entry.text, dir: entry.dir, contentType: entry.contentType });
        });
      }
    });
    bySrc[String(set.source_id)] = { color, contentsByLayer };
  });

  const sourceImgRows = sets.map(set => ({
    sourceId: String(set.source_id),
    color: colorMap[String(set.source_id)] || COLOR_SLOTS[0],
    sels: getImgSels(set, lineRegionsByContentId),
    dir: getSetDir(set),
  })).filter(row => row.sels.length > 0);

  return (
    <div className="v2-omen-block" id={`omen-${omenSeq}`}>
      <div className="v2-omen-label">{label}</div>

      {/* Grouped-by-author mode nests each source's image row inside its own
          author block below, alongside that source's other layers, instead of
          sharing this floating block above every block. */}
      {grouping !== 'entry-author-layer' && sourceImgRows.length > 0 && (
        <div className="layer-image" style={{ marginBottom: '0.75rem' }}>
          {sourceImgRows.map(({ sourceId, color, sels, dir }, rowIdx) => (
            <ImageCropRow key={sourceId} color={color} sels={sels} dir={dir}
              style={{ marginBottom: rowIdx < sourceImgRows.length - 1 ? 8 : 0 }} />
          ))}
        </div>
      )}

      {grouping !== 'entry-author-layer' ? (
        
        <>
          {contentLayers.map(l => {
            const activeRows = byLayer[l.key].filter(r => r.text);
            if (activeRows.length === 0) return null;
            return (
              <OmenLayerGroup key={l.key}
                l={l} activeRows={activeRows}
                omenSeq={omenSeq} sources={sources} editProps={editProps}
                groupByLanguage={l.key === 'translation' && groupTranslationsByLanguage}
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
          const { color, contentsByLayer } = bySrc[srcId];
          const author = srcLabel(sources[srcId], srcId);
          const isMorphAuthor = srcId === String(firstSet?.source_id);
          const imgSels = getImgSels(set, lineRegionsByContentId);
          return (
            <div key={srcId} className={`author-block author-${srcId}`}>
              <div className="author-block-header" style={{ background: color.bg }}>
                <span className="author-block-name" style={{ color: color.text }}>{author}</span>
              </div>
              {imgSels.length > 0 && (
                <div className="v2-layer-row-group author-block-row layer-image">
                  <span className="v2-layer-row-label">Image</span>
                  <ImageCropRow bare color={color} sels={imgSels} dir={getSetDir(set)} />
                </div>
              )}
              {contentLayers.map(l => {
                const entries = contentsByLayer[l.key];
                if (!entries.length) return null;
                const byLang = l.key === 'translation' && groupTranslationsByLanguage;
                const renderEntry = (entry, i) => (
                  <EditableText
                    key={i}
                    plain
                    lineKey={layerLineKey(omenSeq, srcId, l.key, entry.contentType)}
                    sourceId={srcId}
                    layerKey={l.key}
                    layerLabel={l.label}
                    sourceLabel={author}
                    color={color}
                    rawText={entry.text}
                    contentType={entry.contentType}
                    editProps={editProps}
                    className={`v2-layer-text v2-text-${l.key}`}
                    dir={entry.dir || undefined}
                  />
                );
                return (
                  <div key={l.key} className={`v2-layer-row-group author-block-row ${l.cls}`}>
                    <span className="v2-layer-row-label">{l.label}</span>
                    <div className="v2-layer-authors">
                      {byLang
                        ? groupRowsByLanguage(entries).map(g => (
                            <div key={g.code} className="v2-translation-lang-group">
                              <span className="v2-translation-lang-header">{g.label}</span>
                              {g.rows.map(renderEntry)}
                            </div>
                          ))
                        : entries.map(renderEntry)
                      }
                    </div>
                  </div>
                );
              })}
              {isMorphAuthor && morphs.length > 0 && (
                <div className="v2-layer-row-group author-block-row layer-morph-transcr layer-morph-gloss">
                  <span className="v2-layer-row-label">Morph.</span>
                  <EditableMorphLine
                    bare
                    plain
                    lineKey={`${omenSeq}-morph-${firstSet?.source_id}`}
                    sourceId={String(firstSet?.source_id)}
                    color={colorMap[String(firstSet?.source_id)] || COLOR_SLOTS[0]}
                    morphs={morphs}
                    sourceLabel={srcLabel(sources[String(firstSet?.source_id)], String(firstSet?.source_id))}
                    editProps={editProps}
                  />
                </div>
              )}
            </div>
          );
        })
      )}

    </div>
  );
}

const GROUPING_LABELS = { author: 'Author', entry: 'Entry', layer: 'Layer' };

// The "Group by ... then ..." setting. There are 3 dimensions (author, entry,
// layer); picking the first two always determines the third automatically.
class GroupingModel {
  constructor(mode) {
    this.mode = GroupingModel.MODES[mode] ? mode : 'author-entry-layer';
  }

  get first()      { return GroupingModel.MODES[this.mode][0];}
  get second()     { return GroupingModel.MODES[this.mode][1];}
  get third()      { return GroupingModel.MODES[this.mode][2]; }
  get secondOpts() { return GroupingModel.SECOND_OPTS[this.first]; }

  withFirst(v){
    const opts = GroupingModel.SECOND_OPTS[v];
    const second = opts.includes(this.second) ? this.second : opts[0];
    return new GroupingModel(GroupingModel.resolve(v, second));
  }

  withSecond(v){
    return new GroupingModel(GroupingModel.resolve(this.first, v));
  }

  static resolve(first, second){
    const twoKey = `${first}-${second}`;
    if (GroupingModel.MODES[twoKey]) return twoKey;
    const third = ['author', 'entry', 'layer'].find(x => x !== first && x !== second);
    const key = `${first}-${second}-${third}`;
    return GroupingModel.MODES[key] ? key : 'author-entry-layer';
  }
}

GroupingModel.MODES = {
  'author-layer':       ['author', 'layer',  null],
  'author-entry-layer': ['author', 'entry',  'layer'],
  'entry-layer-author': ['entry',  'layer',  'author'],
  'entry-author-layer': ['entry',  'author', 'layer'],
  'layer-entry-author': ['layer',  'entry',  'author'],
  'layer-author-entry': ['layer',  'author', 'entry'],
};
GroupingModel.SECOND_OPTS = { author: ['layer', 'entry'], entry: ['layer', 'author'], layer: ['entry', 'author'] };

// Layer -> Entry -> Author  or  Layer -> Author -> Entry
function LayerFirstView({ grouping, sets, sources, sourceIds, colorMap, editProps, lineRegionsByContentId, seqRank, hiddenLanguages, groupTranslationsByLanguage }) {
  const baseLayers = LAYERS.filter(l => !l.isMorph);
  // Layer -> Entry -> Author leads with translation, since that's the layer
  // readers care about first in this mode; other layer-first modes keep the
  // default script/translit/transcription/translation ordering.
  const contentLayers = grouping === 'layer-entry-author'
    ? [baseLayers.find(l => l.key === 'translation'), ...baseLayers.filter(l => l.key !== 'translation')].filter(Boolean)
    : baseLayers;
  const bySeq = (seq) => seqRank?.get(seq) ?? seq;
  const omenSeqs = [...new Set(sets.map(s => s.seq))].sort((a, b) => bySeq(a) - bySeq(b));

  const imageSection = grouping === 'layer-entry-author' ? (() => {
    const hasAny = omenSeqs.some(seq => sets.filter(s => s.seq === seq).some(s => getImgSels(s, lineRegionsByContentId).length > 0));
    if (!hasAny) return null;
    return (
      <div key="image" className="layer-section layer-image">
        <div className="layer-section-header">Image</div>
        {omenSeqs.map(seq => {
          const seqSets = sets.filter(s => s.seq === seq)
            .sort((a, b) => sourceIds.indexOf(String(a.source_id)) - sourceIds.indexOf(String(b.source_id)));
          const rows = seqSets.map(s => ({ sourceId: String(s.source_id), color: colorMap[String(s.source_id)] || COLOR_SLOTS[0], sels: getImgSels(s, lineRegionsByContentId), dir: getSetDir(s) })).filter(r => r.sels.length > 0);
          if (!rows.length) return null;
          const entryLabel = setLabel(seqSets[0], seq, seqSets[0]?.type);
          return (
            <div key={seq} className="layer-section-entry">
              <div className="layer-section-entry-label-wrap">
                <div className="layer-section-entry-label">{entryLabel}</div>
              </div>
              {rows.map(r => (
                <ImageCropRow key={r.sourceId} color={r.color} sels={r.sels} dir={r.dir}
                  style={{ marginLeft: 0, paddingLeft: '0.3rem' }} />
              ))}
            </div>
          );
        })}
      </div>
    );
  })() : (() => {
    const hasAny = sourceIds.some(srcId => sets.filter(s => String(s.source_id) === srcId).some(s => getImgSels(s, lineRegionsByContentId).length > 0));
    if (!hasAny) return null;
    return (
      <div key="image" className="layer-section layer-image">
        <div className="layer-section-header">Image</div>
        {sourceIds.map(srcId => {
          const color = colorMap[srcId] || COLOR_SLOTS[0];
          const authorSets = sets.filter(s => String(s.source_id) === srcId).sort((a, b) => bySeq(a.seq) - bySeq(b.seq));
          const entries = authorSets.map(s => ({ seq: s.seq, type: s.type, label: s.label, sels: getImgSels(s, lineRegionsByContentId), dir: getSetDir(s) })).filter(e => e.sels.length > 0);
          if (!entries.length) return null;
          const sourceLabel = srcLabel(sources[srcId], srcId);
          return (
            <div key={srcId} className={`author-block author-${srcId}`}>
              <div className="author-block-header" style={{ background: color.bg }}>
                <span className="author-block-name" style={{ color: color.text }}>{sourceLabel}</span>
              </div>
              {entries.map(e => (
                <div key={e.seq} className="v2-layer-row-group author-block-row">
                  <span className="v2-layer-row-label">{setLabel(e, e.seq, e.type)}</span>
                  <ImageCropRow bare color={color} sels={e.sels} dir={e.dir} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  })();

  return [imageSection, ...contentLayers.map(layer => {
    const layerKey = layer.key;
    const getContents = set => pickContentsForLayer(set.contents, layerKey, hiddenLanguages);

    if (layerKey === 'translation' && groupTranslationsByLanguage) {
      // Translation is a special case: language is a translation-only
      // subgroup, not one of the three main grouping dimensions, so it
      // doesn't touch how other layers are laid out. Below the language
      // split, it still follows the active layer-first sub-mode: entry
      // then author for layer-entry-author, author then entry otherwise.
      const allRows = [];
      sets.forEach(s => {
        const color = colorMap[String(s.source_id)] || COLOR_SLOTS[0];
        getContents(s).forEach(c => allRows.push({ seq: s.seq, type: s.type, label: s.label, sourceId: String(s.source_id), color, ...c }));
      });
      if (!allRows.length) return null;

      if (grouping === 'layer-entry-author') {
        return (
          <div key={layerKey} className={`layer-section ${layer.cls}`}>
            <div className="layer-section-header">{layer.label}</div>
            {groupRowsByLanguage(allRows).map(g => {
              const langSeqs = [...new Set(g.rows.map(r => r.seq))].sort((a, b) => bySeq(a) - bySeq(b));
              return (
                <div key={g.code} className="v2-translation-lang-block">
                  <div className="v2-translation-lang-block-header">{g.label}</div>
                  {langSeqs.map(seq => {
                    const seqRows = g.rows.filter(r => r.seq === seq)
                      .sort((a, b) => sourceIds.indexOf(a.sourceId) - sourceIds.indexOf(b.sourceId));
                    if (!seqRows.length) return null;
                    const entryLabel = setLabel(seqRows[0], seq, seqRows[0].type);
                    return (
                      <LayerEntryGroup key={seq}
                        seq={seq} entryLabel={entryLabel} rows={seqRows}
                        sources={sources} layerKey={layerKey} layerLabel={layer.label}
                        editProps={editProps}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      }

      return (
        <div key={layerKey} className={`layer-section ${layer.cls}`}>
          <div className="layer-section-header">{layer.label}</div>
          {groupRowsByLanguage(allRows).map(g => (
            <div key={g.code} className="v2-translation-lang-block">
              <div className="v2-translation-lang-block-header">{g.label}</div>
              {sourceIds.filter(srcId => g.rows.some(r => r.sourceId === srcId)).map(srcId => {
                const color = colorMap[srcId] || COLOR_SLOTS[0];
                const sourceLabel = srcLabel(sources[srcId], srcId);
                const authorRows = g.rows.filter(r => r.sourceId === srcId).sort((a, b) => bySeq(a.seq) - bySeq(b.seq));
                return (
                  <div key={srcId} className={`author-block author-${srcId}`}>
                    <div className="author-block-header" style={{ background: color.bg }}>
                      <span className="author-block-name" style={{ color: color.text }}>{sourceLabel}</span>
                    </div>
                    {authorRows.map((r, i) => (
                      <div key={i} className="v2-layer-row-group author-block-row">
                        <span className="v2-layer-row-label">{setLabel(r, r.seq, r.type)}</span>
                        <div className="v2-layer-authors">
                          <EditableText
                            plain
                            lineKey={layerLineKey(r.seq, srcId, layerKey, r.contentType)}
                            sourceId={srcId}
                            layerKey={layerKey}
                            layerLabel={layer.label}
                            sourceLabel={sourceLabel}
                            color={color}
                            rawText={r.text}
                            contentType={r.contentType}
                            editProps={editProps}
                            className={`v2-layer-text v2-text-${layerKey}`}
                            dir={r.dir || undefined}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    if (grouping === 'layer-entry-author') {
      // Layer → Entry → Author: for each layer, entries in order, authors stacked within
      const hasAny = omenSeqs.some(seq =>
        sets.filter(s => s.seq === seq).some(s => getContents(s).length > 0)
      );
      if (!hasAny) return null;
      return (
        <div key={layerKey} className={`layer-section ${layer.cls}`}>
          <div className="layer-section-header">{layer.label}</div>
          {omenSeqs.map(seq => {
            const seqSets = sets.filter(s => s.seq === seq)
              .sort((a, b) => sourceIds.indexOf(String(a.source_id)) - sourceIds.indexOf(String(b.source_id)));
            const rows = seqSets.flatMap(s => {
              const color = colorMap[String(s.source_id)] || COLOR_SLOTS[0];
              return getContents(s).map(c => ({ sourceId: String(s.source_id), color, ...c }));
            });
            if (!rows.length) return null;
            const entryLabel = setLabel(seqSets[0], seq, seqSets[0]?.type);
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
      const hasAny = sourceIds.some(srcId => sets.filter(s => String(s.source_id) === srcId).some(s => getContents(s).length > 0));
      if (!hasAny) return null;
      return (
        <div key={layerKey} className={`layer-section ${layer.cls}`}>
          <div className="layer-section-header">{layer.label}</div>
          {sourceIds.map(srcId => {
            const color = colorMap[srcId] || COLOR_SLOTS[0];
            const authorSets = sets.filter(s => String(s.source_id) === srcId).sort((a, b) => bySeq(a.seq) - bySeq(b.seq));
            // One entry can now carry several rows (one per translation language);
            // group them by seq so the entry label still appears once, with the
            // language rows stacked underneath it.
            const entryGroups = [];
            const seqIndex = new Map();
            authorSets.forEach(s => {
              getContents(s).forEach(c => {
                if (!seqIndex.has(s.seq)) {
                  seqIndex.set(s.seq, entryGroups.length);
                  entryGroups.push({ seq: s.seq, type: s.type, label: s.label, items: [] });
                }
                entryGroups[seqIndex.get(s.seq)].items.push(c);
              });
            });
            if (!entryGroups.length) return null;
            const sourceLabel = srcLabel(sources[srcId], srcId);
            return (
              <div key={srcId} className={`author-block author-${srcId}`}>
                <div className="author-block-header" style={{ background: color.bg }}>
                  <span className="author-block-name" style={{ color: color.text }}>{sourceLabel}</span>
                </div>
                {entryGroups.map(g => (
                  <div key={g.seq} className="v2-layer-row-group author-block-row">
                    <span className="v2-layer-row-label">{setLabel(g, g.seq, g.type)}</span>
                    <div className="v2-layer-authors">
                      {g.items.map((item, i) => (
                        <EditableText
                          key={i}
                          plain
                          lineKey={layerLineKey(g.seq, srcId, layerKey, item.contentType)}
                          sourceId={srcId}
                          layerKey={layerKey}
                          layerLabel={layer.label}
                          sourceLabel={sourceLabel}
                          color={color}
                          rawText={item.text}
                          contentType={item.contentType}
                          editProps={editProps}
                          className={`v2-layer-text v2-text-${layerKey}`}
                          dir={item.dir || undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    }
  })];
}

// Author -> Layer view: one section per author
// grouping='author-layer'      -> Author -> Layer (all entries shown flat under each layer)
// grouping='author-entry-layer' -> Author -> Entry -> Layer (per-entry sub-sections)
function AuthorLayerView({ sets, sources, sourceIds, colorMap, grouping, editProps, lineRegionsByContentId, seqRank, hiddenLanguages, groupTranslationsByLanguage }) {
  const contentLayers = LAYERS.filter(l => !l.isMorph);
  // Independent of `sourceIds`' display order (which "Author A-Z" may have
  // resorted alphabetically) -- morph authorship is a stable data fact, not a
  // reflection of whichever author currently sorts first.
  const morphAuthorId = String(sets[0]?.source_id);
  const bySeq = (seq) => seqRank?.get(seq) ?? seq;

  return sourceIds.map(srcId => {
    const color  = colorMap[srcId] || COLOR_SLOTS[0];
    const author = srcLabel(sources[srcId], srcId);
    const authorSets = sets.filter(s => String(s.source_id) === srcId).sort((a, b) => bySeq(a.seq) - bySeq(b.seq));
    const isMorphAuthor = srcId === morphAuthorId;

    const header = (
      <div className="author-section-header" style={{ borderLeft: `3px solid ${color.border}`, background: color.bg }}>
        <span className="author-section-name" style={{ color: color.text }}>{author}</span>
      </div>
    );

    if (grouping === 'author-layer') {
      // Author -> Layer: group all entries under each layer heading
      const morphs = isMorphAuthor ? authorSets.flatMap(s => s.morphs || []) : [];
      const imageEntries = authorSets
        .map(s => ({ seq: s.seq, type: s.type, label: s.label, sels: getImgSels(s, lineRegionsByContentId), dir: getSetDir(s) }))
        .filter(e => e.sels.length > 0);
      const layerHasAny = contentLayers.some(l =>
        authorSets.some(s => (s.contents || []).some(c => contentTypeToLayer(c.type) === l.key))
      );
      if (!layerHasAny && morphs.length === 0 && imageEntries.length === 0) return null;
      return (
        <div key={srcId} className={`author-section author-${srcId}`}>
          {header}
          {imageEntries.length > 0 && (
            <div className="v2-layer-row-group author-block-row layer-image">
              <span className="v2-layer-row-label">Image</span>
              <div className="v2-layer-authors">
                {imageEntries.map(e => (
                  <div key={e.seq} className="author-line-flat">
                    <span className="entry-seq-tag">{setLabel(e, e.seq, e.type)}</span>
                    <ImageCropRow bare color={color} sels={e.sels} dir={e.dir} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {contentLayers.map(l => {
            const entries = authorSets.flatMap(s =>
              pickContentsForLayer(s.contents, l.key, hiddenLanguages)
                .map(c => ({ seq: s.seq, type: s.type, label: s.label, ...c })));
            if (!entries.length) return null;
            const byLang = l.key === 'translation' && groupTranslationsByLanguage;
            const renderEntry = (e, i) => (
              <div key={i} className="author-line-flat">
                <span className="entry-seq-tag">{setLabel(e, e.seq, e.type)}</span>
                <EditableText
                  plain
                  lineKey={layerLineKey(e.seq, srcId, l.key, e.contentType)}
                  sourceId={srcId}
                  layerKey={l.key}
                  layerLabel={l.label}
                  sourceLabel={author}
                  color={color}
                  rawText={e.text}
                  contentType={e.contentType}
                  editProps={editProps}
                  className={`v2-layer-text v2-text-${l.key}`}
                  dir={e.dir || undefined}
                />
              </div>
            );
            return (
              <div key={l.key} className={`v2-layer-row-group author-block-row ${l.cls}`}>
                <span className="v2-layer-row-label">{l.label}</span>
                <div className="v2-layer-authors">
                  {byLang
                    ? groupRowsByLanguage(entries).map(g => (
                        <div key={g.code} className="v2-translation-lang-group">
                          <span className="v2-translation-lang-header">{g.label}</span>
                          {g.rows.map(renderEntry)}
                        </div>
                      ))
                    : entries.map(renderEntry)
                  }
                </div>
              </div>
            );
          })}
          {morphs.length > 0 && (
            <div className="v2-layer-row-group author-block-row layer-morph-transcr layer-morph-gloss">
              <span className="v2-layer-row-label">Morph.</span>
              <EditableMorphLine
                bare
                plain
                lineKey={`0-morph-${srcId}`}
                sourceId={srcId}
                color={color}
                morphs={morphs}
                sourceLabel={author}
                editProps={editProps}
              />
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
          const label = setLabel(set, set.seq, set.type);
          const contentsByLayer = {};
          contentLayers.forEach(l => {
            contentsByLayer[l.key] = pickContentsForLayer(set.contents, l.key, hiddenLanguages);
          });
          const morphs = isMorphAuthor ? (set.morphs || []) : [];
          const imgSels = getImgSels(set, lineRegionsByContentId);
          const hasAny = contentLayers.some(l => contentsByLayer[l.key].length > 0) || morphs.length > 0 || imgSels.length > 0;
          if (!hasAny) return null;

          return (
            <div key={set.id} className="author-section-entry">
              <div className="author-section-entry-label">{label}</div>
              {imgSels.length > 0 && (
                <div className="v2-layer-row-group author-block-row layer-image">
                  <span className="v2-layer-row-label">Image</span>
                  <ImageCropRow bare color={color} sels={imgSels} dir={getSetDir(set)} />
                </div>
              )}
              {contentLayers.map(l => {
                const entries = contentsByLayer[l.key];
                if (!entries.length) return null;
                const byLang = l.key === 'translation' && groupTranslationsByLanguage;
                const renderEntry = (entry, i) => (
                  <EditableText
                    key={i}
                    plain
                    lineKey={layerLineKey(set.seq, srcId, l.key, entry.contentType)}
                    sourceId={srcId}
                    layerKey={l.key}
                    layerLabel={l.label}
                    sourceLabel={author}
                    color={color}
                    rawText={entry.text}
                    contentType={entry.contentType}
                    editProps={editProps}
                    className={`v2-layer-text v2-text-${l.key}`}
                    dir={entry.dir || undefined}
                  />
                );
                return (
                  <div key={l.key} className={`v2-layer-row-group author-block-row ${l.cls}`}>
                    <span className="v2-layer-row-label">{l.label}</span>
                    <div className="v2-layer-authors">
                      {byLang
                        ? groupRowsByLanguage(entries).map(g => (
                            <div key={g.code} className="v2-translation-lang-group">
                              <span className="v2-translation-lang-header">{g.label}</span>
                              {g.rows.map(renderEntry)}
                            </div>
                          ))
                        : entries.map(renderEntry)
                      }
                    </div>
                  </div>
                );
              })}
              {morphs.length > 0 && (
                <div className="v2-layer-row-group author-block-row layer-morph-transcr layer-morph-gloss">
                  <span className="v2-layer-row-label">Morph.</span>
                  <EditableMorphLine
                    bare
                    plain
                    lineKey={`${set.seq}-morph-${srcId}`}
                    sourceId={srcId}
                    color={color}
                    morphs={morphs}
                    sourceLabel={author}
                    editProps={editProps}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  });
}

// Tracks the actual on-screen rectangle occupied by an <img>'s pixel content
// -- excluding padding, and accounting for any object-fit letterboxing (contain)
// or cropping (cover) -- so percentage-based selection boxes (top/left/width/
// height are fractions of the image's own pixels, per the backend Selection
// model) line up exactly no matter how the surrounding layout scales or crops
// the element. Also returns the element's visible (padding-excluded) viewport,
// since under `cover` the image rect itself extends beyond what's visible.
function useImageContentBox(imgRef, src, fit = 'contain') {
  const [box, setBox] = useState(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    setBox(null);

    const recompute = () => {
      if (!img.naturalWidth || !img.naturalHeight || !img.clientWidth || !img.clientHeight) return;
      const cs = window.getComputedStyle(img);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const padT = parseFloat(cs.paddingTop) || 0;
      const padB = parseFloat(cs.paddingBottom) || 0;
      const contentW = img.clientWidth - padL - padR;
      const contentH = img.clientHeight - padT - padB;
      if (contentW <= 0 || contentH <= 0) return;

      const scaleToFitW = contentW / img.naturalWidth;
      const scaleToFitH = contentH / img.naturalHeight;
      const scale = fit === 'cover' ? Math.max(scaleToFitW, scaleToFitH) : Math.min(scaleToFitW, scaleToFitH);
      const renderW = img.naturalWidth * scale;
      const renderH = img.naturalHeight * scale;
      setBox({
        left: padL + (contentW - renderW) / 2,
        top: padT + (contentH - renderH) / 2,
        width: renderW,
        height: renderH,
        viewW: contentW,
        viewH: contentH,
      });
    };

    if (img.complete) recompute();
    img.addEventListener('load', recompute);
    const ro = new ResizeObserver(recompute);
    ro.observe(img);
    return () => { img.removeEventListener('load', recompute); ro.disconnect(); };
  }, [imgRef, src, fit]);

  return box;
}

const SELECTION_TOOLTIP_W = 160;
const SELECTION_TOOLTIP_H_EST = 46;

// A manuscript image with its line/omen selection regions overlaid. All regions
// sit at a low-opacity resting outline as soon as the image loads; hovering one
// brightens it and shows a detail tooltip (fetched live from the division's real
// text, nothing hardcoded); clicking jumps the text panel to that exact line.
function SelectionOverlay({ src, alt, selections, divisionMetaById, onJumpToLine, imgClassName, imgStyle, onImgError, fit = 'contain', wrapperStyle, highlightedDivisionId }) {
  const imgRef = useRef(null);
  const box = useImageContentBox(imgRef, src, fit);
  const [hoveredId, setHoveredId] = useState(null);

  const sels = Array.isArray(selections) ? selections.filter(s => s.top != null && s.left != null) : [];
  const hoveredSel = sels.find(s => s.id === hoveredId) || null;
  const meta = hoveredSel?.division_id != null ? divisionMetaById?.[hoveredSel.division_id] : null;

  const handleClick = (sel) => {
    const m = sel.division_id != null ? divisionMetaById?.[sel.division_id] : null;
    if (m && onJumpToLine) onJumpToLine(m.seq, m.sourceId, m.layerKey, m.contentType);
  };

  let tooltipStyle = null;
  if (box && hoveredSel && meta) {
    const anchorX = box.left + hoveredSel.left * box.width;
    const rectTop = box.top + hoveredSel.top * box.height;
    const rectBottom = box.top + (hoveredSel.top + hoveredSel.height) * box.height;
    const spaceBelow = box.viewH - rectBottom;
    const showBelow = spaceBelow >= SELECTION_TOOLTIP_H_EST || rectTop < SELECTION_TOOLTIP_H_EST;
    const rawTop = showBelow ? rectBottom + 6 : rectTop - 6 - SELECTION_TOOLTIP_H_EST;
    tooltipStyle = {
      left: Math.max(0, Math.min(anchorX, box.viewW - SELECTION_TOOLTIP_W)),
      top: Math.max(0, Math.min(rawTop, box.viewH - SELECTION_TOOLTIP_H_EST)),
    };
  }

  return (
    <div
      className="ms-overlay-wrap"
      style={{
        position: 'relative',
        display: imgStyle?.height ? 'block' : 'inline-block',
        width: imgStyle?.width,
        height: imgStyle?.height,
        overflow: fit === 'cover' ? 'hidden' : undefined,
        ...wrapperStyle,
      }}
      onMouseLeave={() => setHoveredId(null)}
    >
      <img ref={imgRef} className={imgClassName} src={src} alt={alt}
        style={imgStyle} onError={onImgError} />
      {box && sels.map(sel => {
        const m = sel.division_id != null ? divisionMetaById?.[sel.division_id] : null;
        const isHovered = sel.id === hoveredId;
        const isJumpHighlighted = highlightedDivisionId != null && sel.division_id === highlightedDivisionId;
        return (
          <div
            key={sel.id}
            className={`ms-selection-rect${(isHovered || isJumpHighlighted) ? ' active' : ''}`}
            style={{
              left: box.left + sel.left * box.width,
              top: box.top + sel.top * box.height,
              width: sel.width * box.width,
              height: sel.height * box.height,
              cursor: m ? 'pointer' : 'default',
            }}
            onMouseEnter={() => setHoveredId(sel.id)}
            onMouseLeave={() => setHoveredId(prev => (prev === sel.id ? null : prev))}
            onClick={() => handleClick(sel)}
          />
        );
      })}
      {hoveredSel && meta && tooltipStyle && (
        <div className="ms-selection-tooltip" style={{ ...tooltipStyle, width: SELECTION_TOOLTIP_W }}>
          <div className="ms-tooltip-title">
            {meta.omenType === 'omen' ? 'Omen' : 'Line'} {meta.seq}
          </div>
          {meta.label && <div className="ms-tooltip-label">{meta.label}</div>}
        </div>
      )}
    </div>
  );
}

function ManuscriptPanel({ artifact, groups, hiddenAuthors, activeSourceIds, sources, colorMap, divisionMetaById, onJumpToLine, activeImgObj, onActiveImgObjChange, highlightedDivisionId }) {
  const [fullscreen, setFullscreen]             = useState(false);
  const [openSources, setOpenSources]           = useState(new Set());
  const [openGroups, setOpenGroups]             = useState(new Set());
  const [zoomLevel, setZoomLevel]               = useState(1);

  const groupList = Array.isArray(groups) ? groups : [];

  const groupsBySource = {};
  groupList.forEach(g => {
    const sid = String(g.images?.[0]?.source_id ?? '');
    if (!sid || sid === 'null' || sid === 'undefined') return;
    if (!groupsBySource[sid]) groupsBySource[sid] = [];
    groupsBySource[sid].push(g);
  });

  const hasSourceInfo = Object.keys(groupsBySource).length > 0;
  const activeSourcesWithImages = hasSourceInfo
    ? activeSourceIds.filter(sid => (groupsBySource[sid]?.length ?? 0) > 0)
    : [];

  const sortedGroups = [...groupList].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  useEffect(() => {
    if (hasSourceInfo) {
      if (activeSourcesWithImages.length === 0) return;
      setOpenSources(prev => {
        const next = new Set(prev);
        activeSourcesWithImages.forEach(sid => next.add(sid));
        return next;
      });
      setOpenGroups(prev => {
        const next = new Set(prev);
        activeSourcesWithImages.forEach(sid => {
          const first = (groupsBySource[sid] || []).sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))[0];
          if (first) next.add(first.id);
        });
        return next;
      });
    } else if (sortedGroups.length > 0) {
      setOpenGroups(prev => {
        if (prev.size > 0) return prev;
        return new Set([sortedGroups[0].id]);
      });
    }
  }, [hasSourceInfo, activeSourcesWithImages.join(','), sortedGroups.map(g => g.id).join(',')]);

  const firstAvailableImg = hasSourceInfo && activeSourcesWithImages.length > 0
    ? (groupsBySource[activeSourcesWithImages[0]] || []).sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))[0]?.images?.[0] ?? null
    : sortedGroups[0]?.images?.[0] ?? null;
  const currentImgObj = activeImgObj || firstAvailableImg;
  const currentImgSrc = currentImgObj ? apiUrl(`/api/images/${currentImgObj.uri}`) : null;

  const { data: rawSelections } = useFetch(currentImgObj ? apiUrl(`/api/images/${currentImgObj.id}/selections`) : null);
  const selections = Array.isArray(rawSelections) ? rawSelections : [];

  const isSingleSource = activeSourcesWithImages.length === 1;

  const toggleSource = sid => setOpenSources(prev => {
    const n = new Set(prev); n.has(sid) ? n.delete(sid) : n.add(sid); return n;
  });
  const toggleGroup = gid => setOpenGroups(prev => {
    const n = new Set(prev); n.has(gid) ? n.delete(gid) : n.add(gid); return n;
  });

  // Flattened, ordered list of every image currently on offer (respecting the
  // active-author filter), sorted group-seq-then-image-order -- same shape
  // regardless of which of the three display modes below is active. goPrev/
  // goNext walk this instead of a single group's images, so paging now works
  // across group and source boundaries instead of stopping at the group edge.
  const flatImages = [];
  if (!hasSourceInfo) {
    sortedGroups.forEach(g => (g.images || []).forEach(img => flatImages.push(img)));
  } else if (isSingleSource) {
    (groupsBySource[activeSourcesWithImages[0]] || [])
      .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
      .forEach(g => (g.images || []).forEach(img => flatImages.push(img)));
  } else {
    activeSourcesWithImages.forEach(sid => {
      (groupsBySource[sid] || [])
        .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
        .forEach(g => (g.images || []).forEach(img => flatImages.push(img)));
    });
  }
  const curFlatIdx = flatImages.findIndex(img => img.id === currentImgObj?.id);
  const canPrev = curFlatIdx > 0;
  const canNext = curFlatIdx >= 0 && curFlatIdx < flatImages.length - 1;
  const goPrev = () => { if (canPrev) onActiveImgObjChange(flatImages[curFlatIdx - 1]); };
  const goNext = () => { if (canNext) onActiveImgObjChange(flatImages[curFlatIdx + 1]); };

  const zoomIn    = () => setZoomLevel(z => Math.min(3,   Math.round((z + 0.25) * 100) / 100));
  const zoomOut   = () => setZoomLevel(z => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
  const zoomReset = () => setZoomLevel(1);

  // One group's thumbnails, stacked vertically in the rail (replaces the old
  // horizontal 3-visible paged strip -- the rail itself scrolls now).
  const renderLineGroup = (g, indent) => {
    const isOpen  = openGroups.has(g.id);
    const allImgs = g.images || [];

    return (
      <div key={g.id} className="v2-rail-group">
        <button
          type="button"
          className="v2-rail-group-header"
          style={{ paddingLeft: 8 + (indent || 0) }}
          onClick={() => toggleGroup(g.id)}
        >
          <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'}`} />
          <span className="v2-rail-group-name">{g.name}</span>
          {allImgs.length > 0 && <span className="v2-rail-count-badge">{allImgs.length}</span>}
        </button>
        {isOpen && allImgs.length > 0 && (
          <div className="v2-rail-thumbs-vert">
            {allImgs.map(img => (
              <img
                key={img.id}
                src={apiUrl(`/api/images/${img.uri}`)}
                alt=""
                className={`v2-rail-thumb${img.id === currentImgObj?.id ? ' active' : ''}`}
                onClick={() => onActiveImgObjChange(img)}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {fullscreen && currentImgSrc && (
        <div className="img-fullscreen-overlay" onClick={() => setFullscreen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <SelectionOverlay
              src={currentImgSrc} alt={artifact.label}
              selections={selections} divisionMetaById={divisionMetaById}
              onJumpToLine={onJumpToLine ? (...args) => { setFullscreen(false); onJumpToLine(...args); } : undefined}
              imgClassName="img-fullscreen-img" imgStyle={{ display: 'block' }}
              highlightedDivisionId={highlightedDivisionId}
            />
          </div>
          <button className="img-fullscreen-close" onClick={() => setFullscreen(false)}>✕</button>
        </div>
      )}

      <div className="v2-manuscript-rail">
        <div className="v2-rail-nav">
          <button type="button" className="v2-rail-nav-btn" onClick={goPrev} disabled={!canPrev} title="Previous image">‹</button>
          <span className="v2-rail-nav-count">{curFlatIdx >= 0 ? `${curFlatIdx + 1} of ${flatImages.length}` : flatImages.length}</span>
          <button type="button" className="v2-rail-nav-btn" onClick={goNext} disabled={!canNext} title="Next image">›</button>
        </div>
        {isSingleSource && (
          <div className="v2-rail-single-source">
            {srcLabel(sources[activeSourcesWithImages[0]], activeSourcesWithImages[0])} images
          </div>
        )}
        <div className="v2-rail-scroll">
          {!hasSourceInfo ? (
            sortedGroups.map(g => renderLineGroup(g, 0))
          ) : isSingleSource ? (
            (groupsBySource[activeSourcesWithImages[0]] || [])
              .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
              .map(g => renderLineGroup(g, 0))
          ) : (
            activeSourcesWithImages.map(sid => {
              const isSourceOpen = openSources.has(sid);
              const srcGroups = (groupsBySource[sid] || []).sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
              const totalImgs = srcGroups.reduce((n, g) => n + (g.images?.length ?? 0), 0);
              const label = srcLabel(sources[sid], sid);
              return (
                <div key={sid} className="v2-rail-source">
                  <button type="button" className="v2-rail-source-header" onClick={() => toggleSource(sid)}>
                    <i className={`fas fa-chevron-${isSourceOpen ? 'down' : 'right'}`} />
                    <span className="v2-rail-source-name">{label}</span>
                    <span className="v2-rail-count-badge">{totalImgs}</span>
                  </button>
                  {isSourceOpen && srcGroups.map(g => renderLineGroup(g, 10))}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="v2-main-image-area">
        <button type="button" className="v2-full-viewer-btn" onClick={() => setFullscreen(true)}>⛶ Full viewer</button>

        {currentImgSrc ? (
          <div className="v2-main-img-zoom-wrap" style={{ transform: `scale(${zoomLevel})` }}>
            <SelectionOverlay
              src={currentImgSrc} alt={artifact.label}
              selections={selections} divisionMetaById={divisionMetaById}
              onJumpToLine={onJumpToLine}
              imgClassName="v2-manuscript-img" imgStyle={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
              onImgError={e => { e.target.style.display = 'none'; }}
              highlightedDivisionId={highlightedDivisionId}
            />
          </div>
        ) : (
          <div className="v2-img-placeholder">No image available</div>
        )}

        <div className="v2-zoom-toolbar">
          <button type="button" className="v2-zoom-btn" onClick={zoomOut} title="Zoom out">−</button>
          <button type="button" className="v2-zoom-btn" onClick={zoomReset} title="Reset zoom">↺</button>
          <button type="button" className="v2-zoom-btn" onClick={zoomIn} title="Zoom in">+</button>
          {currentImgSrc && (
            <a className="v2-zoom-btn" href={currentImgSrc} download title="Download image">⬇</a>
          )}
        </div>
      </div>
    </>
  );
}

function DetailsPanel({ colorMap, editLog, lineOverrides, onUndoEdit, onFlagEdit, onViewInText, onRestore, sources, sourceIds, historyFilter, onClearHistoryFilter }) {
  return (
    <div className="v2-details-panel">
      <div className="detail-panel-header">
        <span className="detail-panel-title">History</span>
        {editLog?.length > 0 && <span className="edit-log-count">{editLog.length}</span>}
      </div>
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
    </div>
  );
}


const ENTRY_SORT_OPTIONS = [
  { key: 'entry-order', label: 'Entry order' },
  { key: 'author-az',   label: 'Author A–Z' },
  { key: 'most-edited', label: 'Most edited' },
];

function FiltersPanel({
  entryCount, sortMode, onSortChange,
  sourceIds, sources, hiddenAuthors, onToggleAuthor, hiddenLayers, onToggleLayer,
  grouping, onGroupingChange, colorMap, sourcesWithImages, allLanguages, hiddenLanguages, onToggleLang,
  groupTranslationsByLanguage, onToggleGroupTranslationsByLanguage,
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef(null);

  useEffect(() => {
    const onDown = e => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    // delay so the click that opened the banner doesn't immediately close it
    const onDown = e => { if (filtersRef.current && !filtersRef.current.contains(e.target)) setFiltersOpen(false); };
    const timer = setTimeout(() => document.addEventListener('mousedown', onDown), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onDown);
    };
  }, [filtersOpen]);

  const current = ENTRY_SORT_OPTIONS.find(o => o.key === sortMode) || ENTRY_SORT_OPTIONS[0];

  const activeFilterCount =
    (hiddenAuthors.size > 0 ? 1 : 0) +
    (hiddenLanguages.size > 0 ? 1 : 0) +
    (hiddenLayers.size > 0 ? 1 : 0) +
    (grouping !== 'author-entry-layer' ? 1 : 0) +
    (groupTranslationsByLanguage ? 1 : 0);

  const sortControl = (
    <>
      <span className="entry-sort-count">{entryCount} entr{entryCount === 1 ? 'y' : 'ies'}</span>
      <div className="entry-sort-trigger-wrap" ref={sortRef}>
        <button type="button" className="entry-sort-trigger" onClick={() => setSortOpen(v => !v)}>
          sorted by {current.label.toLowerCase()}
          <i className="fas fa-sort" />
        </button>
        {sortOpen && (
          <div className="mtb-popover entry-sort-popover">
            {ENTRY_SORT_OPTIONS.map(opt => (
              <div
                key={opt.key}
                className={`mtb-pop-row${opt.key === sortMode ? ' mtb-selected' : ''}`}
                onClick={() => { onSortChange(opt.key); setSortOpen(false); }}
              >
                <span className="mtb-pop-label">{opt.label}</span>
                {opt.key === sortMode && <i className="fas fa-check mtb-check" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="analysis-toolbar" ref={filtersRef}>
      <div className="entry-sort-bar">
        {!filtersOpen && sortControl}

        <div className="filters-btn-wrap">
          <button
            type="button"
            className={`filters-btn${filtersOpen ? ' filters-btn-open' : ''}`}
            onClick={() => setFiltersOpen(v => !v)}
          >
            <i className="ti ti-adjustments-horizontal" />
            Filters
            {activeFilterCount > 0 && <span className="filters-badge">{activeFilterCount}</span>}
            <i className="ti ti-chevron-down" />
          </button>
        </div>
      </div>

      <div className={`filters-banner${filtersOpen ? ' filters-banner-open' : ''}`}>
        <MinimalToolbar
          sourceIds={sourceIds}
          sources={sources}
          hiddenAuthors={hiddenAuthors}
          onToggleAuthor={onToggleAuthor}
          hiddenLayers={hiddenLayers}
          onToggleLayer={onToggleLayer}
          grouping={grouping}
          onGroupingChange={onGroupingChange}
          colorMap={colorMap}
          sourcesWithImages={sourcesWithImages}
          allLanguages={allLanguages}
          hiddenLanguages={hiddenLanguages}
          onToggleLang={onToggleLang}
          groupTranslationsByLanguage={groupTranslationsByLanguage}
          onToggleGroupTranslationsByLanguage={onToggleGroupTranslationsByLanguage}
        />
      </div>

      {filtersOpen && (
        <div className="entry-sort-bar entry-sort-bar-bottom">
          {sortControl}
        </div>
      )}
    </div>
  );
}

function MinimalToolbar({ sourceIds, sources, hiddenAuthors, onToggleAuthor, hiddenLayers, onToggleLayer, grouping, onGroupingChange, colorMap, sourcesWithImages, allLanguages, hiddenLanguages, onToggleLang, groupTranslationsByLanguage, onToggleGroupTranslationsByLanguage }) {
  const [openPopover, setOpenPopover] = useState(null);
  const togglePopover = id => setOpenPopover(p => p === id ? null : id);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpenPopover(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const layerItems = [
    ...LAYERS.filter(l => !l.isMorph).map(l => ({ key: l.key, label: l.long, short: l.label })),
    { key: 'morph', label: 'Morphology', short: 'Morph.' },
    { key: 'image', label: 'Image',      short: 'Image' },
  ];

  const isLayerOn = key => key === 'morph'
    ? !hiddenLayers.has('morph-transcr') && !hiddenLayers.has('morph-gloss')
    : !hiddenLayers.has(key);

  const toggleLayer = key => {
    if (key === 'morph') { onToggleLayer('morph-transcr'); onToggleLayer('morph-gloss'); }
    else onToggleLayer(key);
  };

  const groupingModel = new GroupingModel(grouping);
  const { first, second, third, secondOpts } = groupingModel;

  const setFirst  = v => onGroupingChange(groupingModel.withFirst(v).mode);
  const setSecond = v => onGroupingChange(groupingModel.withSecond(v).mode);

  const activeAuthorIds = sourceIds.filter(id => !hiddenAuthors.has(id));
  const activeLayerItems = layerItems.filter(l => isLayerOn(l.key));

  return (
    <div className="mtb-toolbar mtb-toolbar-inline" ref={ref}>
      <div className="mtb-toolbar-row">
        {/* Authors */}
        <div className="mtb-inline-group">
          <span className="mtb-row-label">Authors</span>
          <div className="mtb-row-pills">
            {activeAuthorIds.map(id => {
              const color = colorMap[id] || COLOR_SLOTS[0];
              const shortName = srcLabel(sources[id], id);
              return (
                <Pill key={id} dotColor={color.border} onRemove={() => onToggleAuthor(id)}>
                  {shortName}
                  {sourcesWithImages?.has(id) && (
                    <i className="fas fa-camera" style={{ fontSize: 10, color: 'var(--text-tertiary, #999)', marginLeft: 3 }} />
                  )}
                </Pill>
              );
            })}
            {hiddenAuthors.size > 0 && (
              <AddPopover
                id="authors" openId={openPopover} onToggle={togglePopover}
                items={sourceIds.map(id => ({
                  key: id,
                  selected: !hiddenAuthors.has(id),
                  onClick: () => onToggleAuthor(id),
                  dotColor: (colorMap[id] || COLOR_SLOTS[0]).border,
                  label: srcLabel(sources[id], id),
                }))}
              />
            )}
          </div>
        </div>

        {/* Layers */}
        <div className="mtb-inline-group">
          <span className="mtb-row-label">Layers</span>
          <div className="mtb-row-pills">
            {activeLayerItems.map(l => (
              <Pill key={l.key} onRemove={() => toggleLayer(l.key)}>
                {l.short}
              </Pill>
            ))}
            {activeLayerItems.length < layerItems.length && (
              <AddPopover
                id="layers" openId={openPopover} onToggle={togglePopover}
                items={layerItems.map(l => ({
                  key: l.key,
                  selected: isLayerOn(l.key),
                  onClick: () => toggleLayer(l.key),
                  label: l.label,
                }))}
              />
            )}
          </div>
        </div>
      </div>

      {/* Language row (only relevant while the Translation layer is active) */}
      {isLayerOn('translation') && allLanguages && allLanguages.length > 1 && (
        <div className="mtb-toolbar-row">
          <div className="mtb-inline-group">
            <span className="mtb-row-label">Language</span>
            <div className="mtb-row-pills">
              {allLanguages.filter(c => !hiddenLanguages.has(c)).map(code => (
                <Pill key={code} onRemove={() => onToggleLang(code)}>
                  {LANG_LABELS[code] || code}
                </Pill>
              ))}
              {hiddenLanguages.size > 0 && (
                <AddPopover
                  id="languages" openId={openPopover} onToggle={togglePopover}
                  items={allLanguages.map(code => ({
                    key: code,
                    selected: !hiddenLanguages.has(code),
                    onClick: () => onToggleLang(code),
                    label: LANG_LABELS[code] || code,
                  }))}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Translation options row (only relevant while the Translation layer is active) */}
      {isLayerOn('translation') && (
        <div className="mtb-toolbar-row">
          <div className="mtb-inline-group">
            <span className="mtb-row-label">Translation options</span>
            <label className="mtb-checkbox-label">
              <input
                type="checkbox"
                className="mtb-checkbox"
                checked={!!groupTranslationsByLanguage}
                onChange={onToggleGroupTranslationsByLanguage}
              />
              Group by language
            </label>
          </div>
        </div>
      )}

      {/* Group by row */}
      <div className="mtb-toolbar-row">
        <div className="mtb-inline-group">
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
    </div>
  );
}

function ArtifactBreadcrumb({ artifactLabel }) {
  return (
    <div className="art-breadcrumb">
      <a href="/directory" className="art-breadcrumb-back">
        <i className="ti ti-arrow-left" /> Back to browse
      </a>
      <div className="art-breadcrumb-sep" />
      <nav className="art-breadcrumb-nav" aria-label="breadcrumb">
        <a href="/" className="art-breadcrumb-link">Home</a>
        <span className="art-breadcrumb-arrow">›</span>
        <a href="/directory" className="art-breadcrumb-link">Browse</a>
        <span className="art-breadcrumb-arrow">›</span>
        <span className="art-breadcrumb-current">{artifactLabel}</span>
      </nav>
    </div>
  );
}

// Flush-left, full-width accordion header (heading-weight title + a "+"/"−"
// glyph) with an always-mounted body that's toggled purely via a CSS class --
// never conditional-rendered away, so ids inside it (jump targets) stay
// queryable by getElementById even while the section reads as "closed".
function AccordionSection({ id, title, isOpen, onToggle, children }) {
  return (
    <div className="art-accordion-section">
      <button type="button" className="art-accordion-header" onClick={onToggle} aria-expanded={isOpen}>
        <span className="art-accordion-title">{title}</span>
        <span className="art-accordion-glyph">{isOpen ? '−' : '+'}</span>
      </button>
      <div className={`art-accordion-body${isOpen ? '' : ' art-accordion-body-closed'}`} id={`art-accordion-body-${id}`}>
        {children}
      </div>
    </div>
  );
}

// Per-source outline browser shown inside the "Contents" accordion: a row of
// source tabs, and below it that source's own division tree (entry -> its
// divisions), each division a click-to-jump link into the manuscript image.
function ContentsOutline({ sourceIds, sources, sets, onJumpToDivision }) {
  const [activeSourceId, setActiveSourceId] = useState(sourceIds[0] || null);

  useEffect(() => {
    if ((!activeSourceId || !sourceIds.includes(activeSourceId)) && sourceIds.length > 0) {
      setActiveSourceId(sourceIds[0]);
    }
  }, [sourceIds.join(','), activeSourceId]);

  if (sourceIds.length === 0) {
    return <div className="art-contents-empty-placeholder">Nothing here.</div>;
  }

  const outline = buildSourceOutline(activeSourceId, sets);

  return (
    <div className="art-contents-outline">
      <div className="art-contents-source-tabs">
        {sourceIds.map(id => (
          <button
            key={id}
            type="button"
            className={`art-contents-source-tab${id === activeSourceId ? ' active' : ''}`}
            onClick={() => setActiveSourceId(id)}
          >
            {srcLabel(sources[id], id)}
          </button>
        ))}
      </div>

      <div className="art-contents-outline-tree">
        {outline.length === 0 && <div className="art-contents-empty-placeholder">Nothing here.</div>}
        {outline.map(entry => (
          <div key={entry.seq} className="art-contents-outline-entry">
            <div className="art-contents-outline-entry-title">{entry.label}</div>
            {entry.divisions.length > 0 && (
              <div className="art-contents-outline-divisions">
                {entry.divisions.map(div => (
                  <button
                    key={div.id}
                    type="button"
                    className="art-contents-outline-division-link"
                    onClick={() => onJumpToDivision(div.id)}
                  >
                    {divisionLabel(div)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtifactHeader({ artifact, allArtifacts, sourceIds, sources, entryCount, headerRef, divisionMetaById, onJumpToLine, isOverviewOpen, onToggleOverview }) {
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      if (headerRef?.current) {
        setShowScrollHint(headerRef.current.getBoundingClientRect().bottom > 120);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [headerRef]);

  const [currentLocation, setCurrentLocation] = useState(null);
  useEffect(() => {
    setCurrentLocation(null);
    if (!artifact.current_location_id) return;
    fetch(apiUrl(`/api/artifacts/location/${artifact.current_location_id}`))
      .then(r => r.json())
      .then(setCurrentLocation)
      .catch(() => {});
  }, [artifact.current_location_id]);

  const coverUri = artifact.cover_image?.uri
    ? apiUrl(`/api/images/${artifact.cover_image.uri}`)
    : null;

  const currentIdx = Array.isArray(allArtifacts)
    ? allArtifacts.findIndex(a => a.id === artifact.id)
    : -1;
  const total = allArtifacts?.length ?? 0;
  const prevArtifact = currentIdx > 0 ? allArtifacts[currentIdx - 1] : null;
  const nextArtifact = currentIdx >= 0 && currentIdx < total - 1 ? allArtifacts[currentIdx + 1] : null;

  const summaryParts = [artifact.origin_date, artifact.script, artifact.language].filter(Boolean);

  const fullMeta = [
    ['Script',      artifact.script],
    ['Language',    artifact.language],
    ['Date',        artifact.origin_date],
    ['Material',    artifact.material],
    ['Dimensions',  artifact.dimensions],
    ['Discovered',  artifact.discovery_date],
    ['Current location', currentLocation?.name],
  ].filter(([, v]) => v);

  return (
    <>
      <div className="art-title-block" ref={headerRef}>
        <h1 className="art-header-title">{artifact.label}</h1>
        <div className="art-header-meta">
          {summaryParts.length > 0 && <span>{summaryParts.join(' · ')}</span>}
        </div>
        <div className={`art-scroll-hint${showScrollHint ? '' : ' art-scroll-hint-hidden'}`}>
          <span>Scroll to explore the analysis</span>
          <i className="fas fa-chevron-down scroll-cue-icon" />
        </div>
        {(prevArtifact || nextArtifact) && (
          <div className="art-header-nav">
            {prevArtifact ? (
              <a href={`/artifact/${prevArtifact.shortname}`} className="art-header-nav-btn">
                {prevArtifact.cover_image?.uri && (
                  <img src={apiUrl(`/api/images/${prevArtifact.cover_image.uri}`)} alt=""
                    className="art-nav-thumb"
                    onError={e => { e.target.style.display = 'none'; }} />
                )}
                ← Prev
              </a>
            ) : <span className="art-header-nav-btn" style={{ opacity: 0.3, pointerEvents: 'none' }}>← Prev</span>}
            <span className="art-header-nav-pos">{currentIdx + 1} of {total}</span>
            {nextArtifact ? (
              <a href={`/artifact/${nextArtifact.shortname}`} className="art-header-nav-btn">
                {nextArtifact.cover_image?.uri && (
                  <img src={apiUrl(`/api/images/${nextArtifact.cover_image.uri}`)} alt=""
                    className="art-nav-thumb"
                    onError={e => { e.target.style.display = 'none'; }} />
                )}
                Next →
              </a>
            ) : <span className="art-header-nav-btn" style={{ opacity: 0.3, pointerEvents: 'none' }}>Next →</span>}
          </div>
        )}
      </div>

      <AccordionSection id="overview" title="Overview" isOpen={isOverviewOpen} onToggle={onToggleOverview}>
        <div className="art-overview-cover">
          {coverUri
            ? <img
                src={coverUri} alt={artifact.label}
                className="art-header-img"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            : <div className="art-header-placeholder"><i className="ti ti-photo" /></div>
          }
        </div>
        <div className="art-meta-details">
          {fullMeta.map(([k, v]) => (
            <div key={k} className="art-meta-row">
              <span className="art-meta-key">{k}</span>
              <span className="art-meta-val">{v}</span>
            </div>
          ))}
          {sourceIds.length > 0 && (
            <div className="art-meta-row">
              <span className="art-meta-key">Sources</span>
              <span className="art-meta-val">
                {sourceIds.map(id => sources[id]?.shortname || `Source ${id}`).join(', ')}
              </span>
            </div>
          )}
        </div>
      </AccordionSection>
    </>
  );
}

export default function ArtifactDisplay() {
  const { shortName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const { data: allArtifacts } = useFetch(apiUrl('/api/artifacts/'));
  const artifact = Array.isArray(allArtifacts) ? allArtifacts.find(a => a.shortname === shortName) || null : null;

  const { data: allSets } = useFetch(artifact ? apiUrl(`/api/artifacts/${artifact.id}/sets`) : null);
  const sets = Array.isArray(allSets) ? allSets : [];

  const { data: rawGroups } = useFetch(artifact ? apiUrl(`/api/artifacts/${artifact.shortname}/image_groups`) : null);
  const imageGroups = Array.isArray(rawGroups) ? rawGroups : [];
  const sourcesWithImages = new Set(
    imageGroups.flatMap(g => (g.images || []).map(img => String(img.source_id)).filter(s => s && s !== 'null' && s !== 'undefined'))
  );

  // Selections live nested under set.contents[].divisions[].selections already
  // (each carries its own image uri), so build the line-region map straight off
  // `sets` instead of depending on a `page`-type division existing for this
  // artifact — many artifacts (e.g. Memorial 118) only have `line` divisions.
  const lineRegionsByContentId = {};
  // Metadata for the manuscript-image hover overlay: divisionId -> the real
  // entry/author/layer this selection belongs to, so the tooltip and the
  // "jump to this line" click can pull live data instead of anything hardcoded.
  const divisionMetaById = {};
  // divisionId -> the uri of the manuscript image its crop selection lives on,
  // so the Contents outline can jump straight to that image on click.
  const divisionImageUriById = {};
  sets.forEach(set => {
    (set.contents || []).forEach(c => {
      const layerKey = contentTypeToLayer(c.type);
      (c.divisions || []).forEach(div => {
        if (!div.selections || div.selections.length === 0) return;
        const cid = div.start_content_id;
        if (!lineRegionsByContentId[cid]) lineRegionsByContentId[cid] = [];
        lineRegionsByContentId[cid].push(div);
        divisionMetaById[div.id] = {
          seq: set.seq,
          omenType: set.type,
          sourceId: String(set.source_id),
          label: divisionLabel(div),
          divType: div.type,
          layerKey,
          contentType: c.type,
        };
        const imgSel = div.selections.find(s => s.uri);
        if (imgSel) divisionImageUriById[div.id] = imgSel.uri;
      });
    });
  });
  const sourceIds = [...new Set(sets.map(s => String(s.source_id)))];

  const [sources, setSources] = useState({});
  useEffect(() => {
    sourceIds.forEach(id => {
      if (sources[id]) return;
      fetch(apiUrl(`/api/sources/${id}`)).then(r => r.json()).then(src => setSources(p => ({ ...p, [id]: src }))).catch(() => {});
    });
  }, [sourceIds.join(',')]);

  const colorMap = {};
  sourceIds.forEach((id, i) => { colorMap[id] = COLOR_SLOTS[i % COLOR_SLOTS.length]; });

  const sourceLanguageMap = {};
  sourceIds.forEach(srcId => {
    const langs = new Set();
    sets.filter(s => String(s.source_id) === srcId).forEach(s => {
      (s.contents || []).forEach(c => {
        if (contentTypeToLayer(c.type) !== 'translation') return;
        const lang = extractLangCode(c.type);
        if (lang) langs.add(lang);
      });
    });
    sourceLanguageMap[srcId] = langs;
  });
  const allLanguages = [...new Set(sourceIds.flatMap(id => [...(sourceLanguageMap[id] || [])]))];

  const [hiddenAuthors, setHiddenAuthors] = useState(() => {
    const p = searchParams.get('hidden_authors');
    return p ? new Set(p.split(',')) : new Set();
  });
  const [hiddenLayers, setHiddenLayers] = useState(() => {
    const p = searchParams.get('hidden_layers');
    return p ? new Set(p.split(',')) : new Set();
  });
  const [hiddenLanguages, setHiddenLanguages] = useState(() => {
    const p = searchParams.get('hidden_languages');
    return p ? new Set(p.split(',')) : new Set();
  });
  const [grouping, setGrouping] = useState(() => searchParams.get('grouping') || 'author-entry-layer');
  const [sortMode, setSortMode] = useState('entry-order');
  const [groupTranslationsByLanguage, setGroupTranslationsByLanguage] = useState(
    () => searchParams.get('translation_group_by_lang') === '1'
  );

  // Translation-only sub-setting: hide and reset it the moment the Translation
  // layer itself is toggled off, so it can't linger enabled for a layer that's
  // no longer shown.
  useEffect(() => {
    if (hiddenLayers.has('translation') && groupTranslationsByLanguage) {
      setGroupTranslationsByLanguage(false);
    }
  }, [hiddenLayers, groupTranslationsByLanguage]);

  useEffect(() => {
    const p = {};
    if (hiddenAuthors.size)   p.hidden_authors   = [...hiddenAuthors].join(',');
    if (hiddenLayers.size)    p.hidden_layers    = [...hiddenLayers].join(',');
    if (hiddenLanguages.size) p.hidden_languages = [...hiddenLanguages].join(',');
    if (grouping !== 'entry-layer-author') p.grouping = grouping;
    if (groupTranslationsByLanguage) p.translation_group_by_lang = '1';
    setSearchParams(p, { replace: true });
  }, [hiddenAuthors, hiddenLayers, hiddenLanguages, grouping, groupTranslationsByLanguage]);

  const [lineOverrides, setLineOverrides]   = useState({});
  const [editLog, setEditLog]               = useState([]);
  const [activeEditor, setActiveEditor]     = useState(null);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [historyFilter, setHistoryFilter]   = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

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
      contributor: user ? (user.full_name || user.email) : 'you', flagged: false,
    }, ...prev]);
  }, [user]);

  const flagEdit = useCallback((id) => {
    setEditLog(prev => prev.map(e => e.id === id ? { ...e, flagged: !e.flagged } : e));
  }, []);

  // The scholarly analysis (where these ids live) is a plain always-mounted,
  // always-visible section now -- not tucked inside a collapsible accordion
  // body -- so these stay exactly as simple as they were before the reflow.
  const viewInText = useCallback((logEntry) => {
    const el = document.getElementById(`omen-${logEntry.omenSeq}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedLine(logEntry.lineKey);
    setTimeout(() => setHighlightedLine(null), 2000);
  }, []);

  // Clicking a manuscript-image selection region jumps the text panel to the
  // exact entry/author/layer line that region belongs to.
  const jumpToLine = useCallback((seq, sourceId, layerKey, contentType) => {
    const lineKey = layerLineKey(seq, sourceId, layerKey || 'script', contentType);
    const el = document.getElementById(`el-${lineKey}`) || document.getElementById(`omen-${seq}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedLine(lineKey);
    setTimeout(() => setHighlightedLine(null), 2000);
  }, []);

  // The reverse of jumpToLine -- clicking a division in the Contents outline
  // switches the manuscript panel to whichever image its crop selection lives
  // on and briefly highlights that region.
  const [activeImgObj, setActiveImgObj] = useState(null);
  const [highlightedDivisionId, setHighlightedDivisionId] = useState(null);
  const jumpToImageSelection = (divisionId) => {
    const uri = divisionImageUriById[divisionId];
    if (!uri) return;
    let matchedImg = null;
    for (const g of imageGroups) {
      const img = (g.images || []).find(i => i.uri === uri);
      if (img) { matchedImg = img; break; }
    }
    if (!matchedImg) return;
    setActiveImgObj(matchedImg);
    setHighlightedDivisionId(divisionId);
    setTimeout(() => setHighlightedDivisionId(null), 2000);
  };

  const headerRef = useRef(null);
  // Drives just the landing accordion (Overview populated; Contents/
  // References/History are empty placeholder shells for now -- the real
  // analysis lives below them, unconditionally rendered, same as always).
  const [openSections, setOpenSections] = useState({ overview: true, contents: false, references: false, history: false });
  const toggleSection = useCallback(key => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historyPanelWidth, setHistoryPanelWidth] = useState(240);
  const historyResizeRef = useRef(false);

  const startHistoryResize = useCallback((e) => {
    e.preventDefault();
    historyResizeRef.current = true;
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!historyResizeRef.current) return;
      const wrap = document.querySelector('.art-analysis-body');
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const next = Math.max(160, Math.min(420, rect.right - e.clientX));
      setHistoryPanelWidth(next);
    };
    const onUp = () => { historyResizeRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const openHistory = useCallback((lineKey, meta) => {
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

  const editProps = {
    lineOverrides, activeEditor, highlightedLine, openEditor, closeEditor, submitEdit, openHistory,
    canEdit: !!user,
    defaultContributor: user ? (user.full_name || user.email) : '',
    promptAuth: () => setShowAuthPrompt(true),
  };

  const toggleAuthor = useCallback(id => {
    setHiddenAuthors(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const toggleLayer = useCallback(key => {
    setHiddenLayers(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  const toggleLanguage = useCallback(code => {
    setHiddenLanguages(prev => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n; });
  }, []);

  const toggleGroupTranslationsByLanguage = useCallback(() => {
    setGroupTranslationsByLanguage(v => !v);
  }, []);


  if (!artifact) return <div className="loading-wrap">Loading…</div>;

  // Language filtering only controls which translation is shown per entry
  // (see contentTypeToLayer/extractLangCode use below) -- it must not drop a
  // source's script/transliteration/transcription just because its translation
  // happens to be in a hidden language.
  const activeSourceIds = sourceIds.filter(id => !hiddenAuthors.has(id));
  const isSingleAuthor = activeSourceIds.length === 1;
  const activeSourceSet = new Set(activeSourceIds);
  const activeSets = sets.filter(s => activeSourceSet.has(String(s.source_id)));
  const omenSeqs = [...new Set(activeSets.map(s => s.seq))].sort((a, b) => a - b);

  const firstAuthorLabelBySeq = {};
  omenSeqs.forEach(seq => {
    const seqSets = activeSets.filter(s => s.seq === seq);
    const coveringLabels = activeSourceIds
      .filter(id => seqSets.some(s => String(s.source_id) === id))
      .map(id => srcLabel(sources[id], id));
    firstAuthorLabelBySeq[seq] = coveringLabels
      .slice()
      .sort((a, b) => a.localeCompare(b))[0] || '';
  });
  const editCountBySeq = {};
  editLog.forEach(e => { editCountBySeq[e.omenSeq] = (editCountBySeq[e.omenSeq] || 0) + 1; });

  const sortedOmenSeqs = [...omenSeqs].sort((a, b) => {
    switch (sortMode) {
      case 'author-az':   return firstAuthorLabelBySeq[a].localeCompare(firstAuthorLabelBySeq[b]) || a - b;
      case 'most-edited': return (editCountBySeq[b] || 0) - (editCountBySeq[a] || 0) || a - b;
      default:            return a - b;
    }
  });
  const seqRank = new Map(sortedOmenSeqs.map((seq, i) => [seq, i]));

  // "Author A-Z" is meant for browsing by scholar, so in author-grouped views
  // it should reorder the author BLOCKS themselves (Washington, Thomsen, ...)
  // alphabetically -- not just the entries nested inside an already-fixed
  // author section, which barely moves anything a viewer would notice.
  const displaySourceIds = sortMode === 'author-az'
    ? [...activeSourceIds].sort((a, b) =>
        srcLabel(sources[a], a).localeCompare(srcLabel(sources[b], b)))
    : activeSourceIds;

  const hideClasses = [
    ...[...hiddenLayers].map(k => `hide-layer-${k}`),
    isSingleAuthor ? 'single-author' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="art-viewer-wrap">
      <ArtifactBreadcrumb artifactLabel={artifact.label} />
      <div className="art-2col-grid">
        <div className="art-2col-left">
          <ArtifactHeader
            artifact={artifact}
            allArtifacts={allArtifacts}
            sourceIds={sourceIds}
            sources={sources}
            entryCount={omenSeqs.length}
            headerRef={headerRef}
            divisionMetaById={divisionMetaById}
            onJumpToLine={jumpToLine}
            isOverviewOpen={openSections.overview}
            onToggleOverview={() => toggleSection('overview')}
          />

          <AccordionSection id="contents" title="Contents" isOpen={openSections.contents} onToggle={() => toggleSection('contents')}>
            <ContentsOutline sourceIds={sourceIds} sources={sources} sets={sets} onJumpToDivision={jumpToImageSelection} />
          </AccordionSection>

          <AccordionSection id="references" title="References" isOpen={openSections.references} onToggle={() => toggleSection('references')}>
            {sourceIds.length > 0 && (
              <div className="v2-references">
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
          </AccordionSection>
        </div>

        <div className="art-2col-right">
          <ManuscriptPanel artifact={artifact} groups={imageGroups} hiddenAuthors={hiddenAuthors} activeSourceIds={activeSourceIds} sources={sources}
            colorMap={colorMap} divisionMetaById={divisionMetaById} onJumpToLine={jumpToLine}
            activeImgObj={activeImgObj} onActiveImgObjChange={setActiveImgObj}
            highlightedDivisionId={highlightedDivisionId} />
        </div>
      </div>

      <div className="art-analysis-section">
        <div className="art-analysis-header">
          <h2 className="art-analysis-title">Analysis</h2>
          <button
            type="button"
            className="art-history-toggle-btn"
            aria-label="History"
            onClick={() => setHistoryPanelOpen(o => !o)}
          >
            <i className="fas fa-clock" />
          </button>
        </div>

        <div className="art-analysis-body">
          <div className="art-analysis-main">
            <FiltersPanel
              entryCount={omenSeqs.length}
              sortMode={sortMode}
              onSortChange={setSortMode}
              sourceIds={sourceIds}
              sources={sources}
              hiddenAuthors={hiddenAuthors}
              onToggleAuthor={toggleAuthor}
              hiddenLayers={hiddenLayers}
              onToggleLayer={toggleLayer}
              grouping={grouping}
              onGroupingChange={setGrouping}
              colorMap={colorMap}
              sourcesWithImages={sourcesWithImages}
              allLanguages={allLanguages}
              hiddenLanguages={hiddenLanguages}
              onToggleLang={toggleLanguage}
              groupTranslationsByLanguage={groupTranslationsByLanguage}
              onToggleGroupTranslationsByLanguage={toggleGroupTranslationsByLanguage}
            />

            <div className={`v2-text-display ${hideClasses}`}>
              {(grouping === 'author-layer' || grouping === 'author-entry-layer') ? (
                <AuthorLayerView
                  sets={activeSets} sources={sources} sourceIds={displaySourceIds}
                  colorMap={colorMap} grouping={grouping} editProps={editProps}
                  lineRegionsByContentId={lineRegionsByContentId} seqRank={seqRank}
                  hiddenLanguages={hiddenLanguages}
                  groupTranslationsByLanguage={groupTranslationsByLanguage}
                />
              ) : (grouping === 'layer-entry-author' || grouping === 'layer-author-entry') ? (
                <LayerFirstView
                  grouping={grouping} sets={activeSets} sources={sources}
                  sourceIds={displaySourceIds} colorMap={colorMap} editProps={editProps}
                  lineRegionsByContentId={lineRegionsByContentId} seqRank={seqRank}
                  hiddenLanguages={hiddenLanguages}
                  groupTranslationsByLanguage={groupTranslationsByLanguage}
                />
              ) : (
                sortedOmenSeqs.map(seq => {
                  const seqSets = activeSets
                    .filter(s => s.seq === seq)
                    .sort((a, b) => sourceIds.indexOf(String(a.source_id)) - sourceIds.indexOf(String(b.source_id)));
                  return (
                    <OmenBlock
                      key={seq} omenSeq={seq} omenType={seqSets[0]?.type || 'omen'}
                      sets={seqSets} sources={sources} colorMap={colorMap}
                      grouping={grouping} editProps={editProps}
                      lineRegionsByContentId={lineRegionsByContentId}
                      hiddenLanguages={hiddenLanguages}
                      groupTranslationsByLanguage={groupTranslationsByLanguage}
                    />
                  );
                })
              )}
            </div>
          </div>

          {historyPanelOpen && (
            <>
              <div
                className="art-history-resize-handle"
                onMouseDown={startHistoryResize}
              />
              <div
                className="art-history-panel"
                style={{ width: historyPanelWidth }}
              >
                <div className="art-history-panel-header">
                  <span>History</span>
                  <button type="button" aria-label="Close history" onClick={() => setHistoryPanelOpen(false)}>✕</button>
                </div>
                <DetailsPanel
                  sources={sources} sourceIds={sourceIds} colorMap={colorMap}
                  editLog={editLog} lineOverrides={lineOverrides}
                  onUndoEdit={undoEdit} onFlagEdit={flagEdit} onViewInText={viewInText} onRestore={restoreVersion}
                  historyFilter={historyFilter} onClearHistoryFilter={() => setHistoryFilter(null)}
                />
              </div>
            </>
          )}
        </div>
      </div>
      {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}
    </div>
  );
}
