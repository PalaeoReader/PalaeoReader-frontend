import React from 'react';
import NavMenu from './NavMenu';

function NavBar() {
    const pages = [<NavMenu />];
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