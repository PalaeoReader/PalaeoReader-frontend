import React from 'react';
import useSWR from 'swr';

const fetcher = url => fetch(url).then(r => r.json());

const SOURCE_IDS = [1, 2, 3, 4];

function SourceCard({ id }) {
  const { data, error } = useSWR(
    `/api/sources/${id}`,
    fetcher
  );
  if (error || !data) return null;
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      padding: '1.5rem 1.75rem',
      marginBottom: '0.75rem',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '0.3rem' }}>
        {data.author}
      </div>
      {data.title && (
        <div style={{ fontStyle: 'italic', color: 'var(--text-md)', fontSize: '0.92rem', marginBottom: '0.4rem' }}>
          {data.title}
        </div>
      )}
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        {data.date_published && <span>Published: {data.date_published}</span>}
        {data.publisher && <span>{data.publisher}</span>}
      </div>
    </div>
  );
}

function SourcesPage() {
  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2.5rem 2rem' }}>
      <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', color: 'var(--dark)' }}>
          Sources &amp; Bibliography
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>
          Academic sources whose analyses are included in this corpus
        </p>
      </div>
      {SOURCE_IDS.map(id => <SourceCard key={id} id={id} />)}
    </div>
  );
}

export default SourcesPage;
