import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = url => fetch(url).then(r => r.json());

// Fetch morph group by ID
const KNOWN_MORPH_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function MorphGroupCard({ id, search }) {
  const { data, error } = useSWR(
    `/api/content/morphs/groups/${id}`,
    fetcher
  );

  if (error || !data) return null;

  const matchesSearch = !search ||
    (data.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (data.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (data.language || '').toLowerCase().includes(search.toLowerCase());

  if (!matchesSearch) return null;

  return (
    <div className="morph-group-card">
      <div className="morph-group-name">{data.name}</div>
      {data.description && <div className="morph-group-desc">{data.description}</div>}
      {data.language && <span className="morph-group-lang">{data.language}</span>}
    </div>
  );
}
function DictionaryPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="dict-layout">
      <div className="dict-sidebar">
        <h2>Dictionary</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Browse morpheme groups: grammatical and lexical entries from the corpus.
        </p>
        <input
          className="dict-search"
          placeholder="Search morphemes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem', lineHeight: 1.6 }}>
          <strong style={{ display: 'block', marginBottom: '0.4rem' }}>About</strong>
          Morpheme groups represent recurring grammatical elements across the corpus.
          Clicking on an artifact's word chips in the text view will show which
          morphemes that word contains.
        </div>
      </div>
      <div className="dict-main">
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: 'var(--dark)', marginBottom: '0.25rem' }}>
            Morpheme Groups
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Sub-word grammatical elements found in the corpus
          </p>
        </div>
        {KNOWN_MORPH_IDS.map(id => (
          <MorphGroupCard key={id} id={id} search={search} />
        ))}
      </div>
    </div>
  );
}

export default DictionaryPage;
