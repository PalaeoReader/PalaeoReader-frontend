import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config';

function useGet(url) {
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

const TYPE_META = {
  'original':                          { label: 'Original script',             cls: 'row-original'        },
  'transliteration':                   { label: 'Transliteration',             cls: 'row-transliteration' },
  'transcription[Turkological]':       { label: 'Transcription (Turkol.)',     cls: 'row-transcription'   },
  'transcription[SovietTurkological]': { label: 'Transcription (Soviet)',      cls: 'row-transcription'   },
  'transcription[IPA]':                { label: 'Transcription (IPA)',         cls: 'row-transcription'   },
  'tranlation[eng]':                   { label: 'Translation (English)',       cls: 'row-translation'     },
  'translation[eng]':                  { label: 'Translation (English)',       cls: 'row-translation'     },
  'translation[rus]':                  { label: 'Translation (Russian)',       cls: 'row-translation'     },
};
const typeMeta = t => TYPE_META[t] || { label: t, cls: '' };

/* preferred display order */
const TYPE_ORDER = [
  'original', 'transliteration',
  'transcription[Turkological]', 'transcription[SovietTurkological]', 'transcription[IPA]',
  'tranlation[eng]', 'translation[eng]', 'translation[rus]',
];
const sortContents = arr =>
  [...arr].sort((a, b) => {
    const ia = TYPE_ORDER.indexOf(a.type);
    const ib = TYPE_ORDER.indexOf(b.type);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

function WordPopup({ token, morphs, onClose }) {
  const mine = (morphs || []).filter(m => m.token_seq === token.seq);
  return (
    <div className="word-popup">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span className="word-popup-title">{token.text}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '1.1rem', lineHeight: 1, cursor: 'pointer', paddingLeft: '1rem' }}>✕</button>
      </div>

      <div className="word-popup-grid">
        <div className="word-popup-item">
          <div className="word-popup-item-label">Word #</div>
          <div className="word-popup-item-value">{token.seq}</div>
        </div>
        <div className="word-popup-item">
          <div className="word-popup-item-label">Type</div>
          <div className="word-popup-item-value">{token.type}</div>
        </div>
      </div>

      {mine.length > 0 && (
        <div className="word-popup-morphs">
          <div className="word-popup-morphs-label">Morphemes ({mine.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
            {mine.map((m, i) => (
              <span key={i} className="morph-chip" title={`type: ${m.type}, seq: ${m.seq}`}>
                {m.text}
                <span style={{ fontSize: '0.65rem', color: 'rgba(201,160,80,0.5)', marginLeft: '0.3rem' }}>{m.type}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {mine.length === 0 && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
          No morpheme data for this token.
        </div>
      )}
    </div>
  );
}

function TypeToggles({ available, visible, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', padding: '0.5rem 1rem', background: 'var(--parchment)', borderBottom: '1px solid var(--border-lt)' }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.25rem' }}>Show:</span>
      {available.map(type => {
        const { label } = typeMeta(type);
        const on = visible.includes(type);
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            style={{
              fontSize: '0.72rem',
              padding: '0.2rem 0.55rem',
              border: `1px solid ${on ? 'var(--gold-dim)' : 'var(--border)'}`,
              background: on ? 'var(--gold)' : 'var(--white)',
              color: on ? 'var(--dark)' : 'var(--text-muted)',
              fontWeight: on ? 700 : 400,
              cursor: 'pointer',
              borderRadius: '2px',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.12s',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function SetBlock({ setId, seq, type, visibleTypes }) {
  const [open, setOpen]             = useState(true);
  const [selectedToken, setSelected] = useState(null);
  const { data, loading, error }    = useGet(apiUrl(`/api/content/sets/${setId}`));

  if (loading) return <div style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>Loading…</div>;
  if (error)   return <div className="error-wrap" style={{ margin: '0.3rem 0' }}>Could not load set {setId}.</div>;
  if (!data?.contents?.length) return null;

  const sorted   = sortContents(data.contents);
  const filtered = visibleTypes.length > 0 ? sorted.filter(c => visibleTypes.includes(c.type)) : sorted;

  /* preview: prefer translation, else transcription */
  const preview =
    data.contents.find(c => c.type.includes('translation'))?.text ||
    data.contents.find(c => c.type.includes('transcription'))?.text || '';
  const previewText = preview.replace(/<[^>]+>/g, '').slice(0, 95) + (preview.length > 95 ? '…' : '');

  const label = type === 'omen' ? `Omen ${seq}` : `Line ${seq}`;

  /* unique tokens: prefer 'original' type per seq */
  const tokBySeq = {};
  (data.tokens || []).forEach(t => {
    if (!tokBySeq[t.seq] || t.type === 'original') tokBySeq[t.seq] = t;
  });
  const displayTokens = Object.values(tokBySeq).sort((a, b) => a.seq - b.seq);

  return (
    <div className="set-block">
      {/* header */}
      <div className="set-block-header" onClick={() => setOpen(o => !o)}>
        <span className="set-block-num">{label}</span>
        {!open && <span className="set-block-preview">{previewText}</span>}
        <span className="set-block-toggle">{open ? '▲ collapse' : '▼ expand'}</span>
      </div>

      {open && (
        <>
          {/* tri-linear table */}
          {filtered.length > 0 ? (
            <table className="trilinear-table">
              <tbody>
                {filtered.map(c => {
                  const { label: rowLabel, cls } = typeMeta(c.type);
                  return (
                    <tr key={c.id}>
                      <td className="tri-label">{rowLabel}</td>
                      <td className={cls}>{c.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
              No content types selected. Use the toggles above to show rows.
            </div>
          )}

          {/* word chips */}
          {displayTokens.length > 0 && (
            <div className="tokens-row">
              <span className="tokens-row-label">Words</span>
              {displayTokens.map(tok => (
                <span
                  key={tok.id}
                  className={`word-chip${selectedToken?.id === tok.id ? ' selected' : ''}`}
                  onClick={() => setSelected(s => s?.id === tok.id ? null : tok)}
                  title="Click to see morphological breakdown"
                >
                  {tok.text}
                </span>
              ))}
            </div>
          )}

          {/* morphology popup */}
          {selectedToken && (
            <WordPopup
              token={selectedToken}
              morphs={data.morphs || []}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

function SourcePanel({ sets, sourceId }) {
  const { data: src } = useGet(apiUrl(`/api/sources/${sourceId}`));

  /* collect all content types available in these sets — we need to peek */
  const [allTypes, setAllTypes]   = useState([]);
  const [visibleTypes, setVisible] = useState([]);

  /* once first set loads, populate type list */
  const FirstSetProbe = ({ setId }) => {
    const { data } = useGet(apiUrl(`/api/content/sets/${setId}`));
    useEffect(() => {
      if (!data?.contents?.length) return;
      const types = [...new Set(data.contents.map(c => c.type))];
      setAllTypes(prev => {
        const merged = [...new Set([...prev, ...types])];
        if (merged.length !== prev.length) {
          setVisible(merged); // show all by default
          return merged;
        }
        return prev;
      });
    }, [data]);
    return null;
  };

  const toggleType = type => {
    setVisible(v =>
      v.includes(type) ? v.filter(t => t !== type) : [...v, type]
    );
  };

  return (
    <div className="source-section">
      <div className="source-section-header">
        <span className="source-section-title">
          {src ? src.author : `Source ${sourceId}`}
        </span>
        {src?.date_published && (
          <span className="source-section-subtitle">{src.date_published}</span>
        )}
        {src?.title && (
          <span className="source-section-subtitle" style={{ fontStyle: 'italic', marginLeft: 'auto', textAlign: 'right', maxWidth: '40%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {src.title}
          </span>
        )}
      </div>

      {/* probe first set for types */}
      {sets[0] && <FirstSetProbe setId={sets[0].id} />}

      {/* content type toggles */}
      {allTypes.length > 0 && (
        <TypeToggles
          available={TYPE_ORDER.filter(t => allTypes.includes(t))}
          visible={visibleTypes}
          onChange={toggleType}
        />
      )}

      {/* sets */}
      {sets.map(s => (
        <SetBlock
          key={s.id}
          setId={s.id}
          seq={s.seq}
          type={s.type}
          visibleTypes={visibleTypes}
        />
      ))}
    </div>
  );
}

export const TextAnalyses = ({ artifactId }) => {
  const { data: sets, loading, error } = useGet(
    artifactId ? apiUrl(`/api/artifacts/${artifactId}/sets`) : null
  );
  const [activeSource, setActiveSource] = useState(null);

  if (loading) return <div className="loading-wrap">Loading analyses…</div>;
  if (error)   return null;
  if (!Array.isArray(sets) || !sets.length) return null;

  /* group by source */
  const bySource = {};
  sets.forEach(s => { (bySource[s.source_id] = bySource[s.source_id] || []).push(s); });
  const sourceIds  = Object.keys(bySource);
  const currentSrc = activeSource || sourceIds[0];

  return (
    <div>
      {/* source selector tabs */}
      <SourceTabBar
        sourceIds={sourceIds}
        current={currentSrc}
        onSelect={setActiveSource}
      />
      <SourcePanel key={currentSrc} sets={bySource[currentSrc]} sourceId={currentSrc} />
    </div>
  );
};

/* tab bar — fetches names */
function SourceTabBar({ sourceIds, current, onSelect }) {
  const [names, setNames] = useState({});
  useEffect(() => {
    sourceIds.forEach(id => {
      fetch(apiUrl(`/api/sources/${id}`))
        .then(r => r.json())
        .then(src => setNames(n => ({ ...n, [id]: src.author })))
        .catch(() => {});
    });
  }, [sourceIds.join(',')]);

  return (
    <div className="source-tabs">
      {sourceIds.map(id => (
        <button
          key={id}
          className={`source-tab${current === id ? ' active' : ''}`}
          onClick={() => onSelect(id)}
        >
          {names[id] || `Source ${id}`}
        </button>
      ))}
    </div>
  );
}

export default TextAnalyses;
