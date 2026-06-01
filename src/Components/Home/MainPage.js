import React from 'react';

function MainPage() {
  return (
    <div className="lp-wrap">

      {/* Runic symbols — decorative background */}
      <div className="lp-runes" aria-hidden="true">
        𐰴𐰍𐰣 𐱅𐰤 𐰴𐰣 𐰇𐱁 𐰢𐰤 𐰖𐰺 𐰛𐰃 𐰋𐰃 𐰓𐰏 𐰆𐰞 𐰾𐰃 𐰢𐰭 𐰃𐰤 𐰴𐰺 𐰆𐰞
      </div>

      {/* Hero */}
      <div className="lp-hero">
        <div className="lp-overline">Digital Research Platform</div>
        <h1 className="lp-title">Digital Palaeography</h1>
        <p className="lp-desc">
          Browse, read, and analyse ancient inscriptions and manuscripts.
          Multi-source scholarly commentary, morphological annotation, and geographic context.
        </p>
        <div className="lp-btns">
          <a href="/directory" className="lp-btn-primary">Browse Corpus</a>
          <a href="/map" className="lp-btn-secondary">Explore Map</a>
          <a href="/dictionary" className="lp-btn-secondary">Dictionary</a>
        </div>
      </div>

      {/* Stats */}
      <div className="lp-stats">
        {[
          ['2',          'Artifacts'],
          ['4',          'Scholarly sources'],
          ['428',        'Annotated words'],
          ['508',        'Morpheme entries'],
          ['732–9th c.', 'Date range CE'],
        ].map(([n, l]) => (
          <div key={l} className="lp-stat">
            <span className="lp-stat-n">{n}</span>
            <span className="lp-stat-l">{l}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

export default MainPage;
