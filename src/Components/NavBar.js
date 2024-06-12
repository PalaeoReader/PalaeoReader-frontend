import React from 'react';

function NavBar() {
    const pages = ['home', 'index', 'map', 'about', 'contact'];
    const navLinks = pages.map(page => {
    return (
        <a href={'/' + page}>
          &nbsp;{page}
        </a>
    )
    });

    return <nav>{navLinks}</nav>;
}


export default NavBar;