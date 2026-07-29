import React from 'react';
import config from '../../config';

function AboutPage() {
  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2.5rem 2rem' }}>
      <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', color: 'var(--dark)' }}>
          About
        </h2>
      </div>
      <p style={{ color: 'var(--text-md)', fontSize: '0.95rem' }}>
        {config.about}
      </p>
    </div>
  );
}

export default AboutPage;
