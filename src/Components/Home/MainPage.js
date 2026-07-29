import React, { useState, useEffect } from 'react';
import config, { apiUrl } from '../../config';

const RUNES = '𐰚 𐰇 𐰀 𐰼 𐰢 𐰤 𐰏 𐰉 𐰆 𐰕 𐰴 𐰣 𐱅 𐰾 𐰃 𐰋 𐰓 𐰞 𐰺 𐱁 𐰭 𐰘 𐰲 𐰿 𐰍 𐱃 𐰙 𐰑 𐰯 𐰱'.split(' ');

function RunicGrid() {
  const cells = Array.from({ length: 180 }, (_, i) => RUNES[i % RUNES.length]);
  return (
    <div className="hp-rune-grid" aria-hidden="true">
      {cells.map((r, i) => <span key={i}>{r}</span>)}
    </div>
  );
}

function ArtifactCard({ artifact }) {
  const coverUri = artifact.cover_image?.uri
    ? apiUrl(`/api/images/${artifact.cover_image.uri}`)
    : null;

  const tags = [
    artifact.script?.split(',')[0]?.trim(),
    artifact.material?.split(',')[0]?.trim(),
  ].filter(Boolean);

  const meta = [artifact.origin_date, artifact.location?.name].filter(Boolean).join(' · ');

  return (
    <a href={`/artifact/${artifact.shortname}`} className="hp-artifact-card">
      <div className="hp-artifact-img-area">
        {coverUri
          ? <img src={coverUri} alt={artifact.label} className="hp-artifact-img"
              onError={e => { e.target.style.display = 'none'; }} />
          : null
        }
        <div className="hp-artifact-img-runes" aria-hidden="true">
          {RUNES.slice(0, 40).map((r, i) => <span key={i}>{r} </span>)}
        </div>
      </div>
      <div className="hp-artifact-body">
        <div className="hp-artifact-name">{artifact.label}</div>
        {meta && <div className="hp-artifact-meta">{meta}</div>}
        {artifact.language && (
          <div className="hp-artifact-language">{artifact.language}</div>
        )}
        <div className="hp-artifact-tags">
          {tags.map(t => <span key={t} className="hp-tag">{t}</span>)}
        </div>
      </div>
    </a>
  );
}

function MainPage() {
  const [artifacts, setArtifacts] = useState([]);

  useEffect(() => {
    fetch(apiUrl('/api/artifacts/'))
      .then(r => r.json())
      .then(setArtifacts)
      .catch(() => {});
  }, []);

  const stats = [
    [artifacts.length || '—', 'Artifacts'],
    ['10',      'Scholarly sources'],
    ['428',     'Annotated words'],
    ['254',     'Morpheme entries'],
    ['732–1291','Date range CE'],
  ];

  return (
    <div className="hp-page">

      {/* ── Hero ── */}
      <section className="hp-hero">
        <RunicGrid />
        <div className="hp-hero-content">
          <h1 className="hp-title">{config.projectName}</h1>
          <p className="hp-desc">
            {config.tagline}
          </p>
          <div className="hp-hero-btns">
            <a href="/directory" className="hp-btn-primary">Browse corpus</a>
            <a href="/map"       className="hp-btn-secondary">Explore map</a>
            <a href="/concordance" className="hp-btn-secondary">Concordance</a>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="hp-stats">
        {stats.map(([n, l]) => (
          <div key={l} className="hp-stat">
            <span className="hp-stat-n">{n}</span>
            <span className="hp-stat-l">{l}</span>
          </div>
        ))}
      </div>

      {/* ── Artifacts ── */}
      <section className="hp-section">
        <div className="hp-section-header">
          <span className="hp-section-label">
            Artifacts in this corpus
            <span className="hp-section-count" style={{ marginLeft: 8 }}>{artifacts.length}</span>
          </span>
          <a href="/directory" className="hp-section-view-all">View all →</a>
        </div>
        <div className="hp-artifact-grid">
          {artifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)}
        </div>
      </section>

      {/* ── Features strip ── */}
      <div className="hp-features">
        {[
          { title: 'Multi-source analysis',    desc: 'Compare translations, transliterations, and transcriptions from multiple scholars side by side with flexible layer and author grouping.' },
          { title: 'Concordance search',        desc: 'Search across all annotated texts by word form, transliteration, or translation with instant cross-corpus results.' },
          { title: 'Community contribution',    desc: 'Add your own analysis, translations, or morphological annotations alongside established scholarly editions.' },
        ].map(f => (
          <div key={f.title} className="hp-feature">
            <div className="hp-feature-title">{f.title}</div>
            <div className="hp-feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* footer */}
      <footer className="hp-footer">
        <span>{config.projectName}</span>
        <span>Open source</span>
        <span>Powered by Palaeoreader</span>
      </footer>

    </div>
  );
}

export default MainPage;
