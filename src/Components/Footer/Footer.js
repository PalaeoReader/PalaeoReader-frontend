import React from 'react';
import poweredByBadge from '../../assets/powered-by.png';
import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <img src={poweredByBadge} alt="Powered by PalaeoReader" className="PoweredByBadge" />
    </footer>
  );
}

export default Footer;
