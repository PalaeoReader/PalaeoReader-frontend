import React, {Component} from 'react';
import {NavMenu} from './NavMenu';

class NavBar extends Component {
  render() {
    return (
      <nav className="NavbarItems">
          <h1 className="NavbarLogo">React</h1>
          <div className="MenuIcon"></div>
          <ul>
            {NavMenu.map((item, index)=> {
              return (
                <li key={index}>
                  <a className={item.cName} href={item.url}>
                    {item.title}
                  </a>
                </li>
              )

            })}
            
          </ul>
      </nav>
    )
  }
}

/*function NavBar() {
    const pages = [NavMenu];
    const navLinks = pages.map(page => {
    return (
        <a href={'/' + page}>
          &nbsp;{page}
        </a>
    )
    });

    return <nav>{navLinks}</nav>;
}*/


export default NavBar;