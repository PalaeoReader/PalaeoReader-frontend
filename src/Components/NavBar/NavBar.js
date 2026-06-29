import React, { Component } from 'react';
import { NavMenu } from './NavMenu';

class NavBar extends Component {
  state = { clicked: false }

  handleClick = () => {
    this.setState({ clicked: !this.state.clicked });
  }

  render() {
    const path = window.location.pathname;
    return (
      <nav className="NavbarItems">
        <h1 className="NavbarLogo"><a href="/">Digital Palaeography</a></h1>
        <ul className={this.state.clicked ? 'nav-menu active' : 'nav-menu'}>
          {NavMenu.map((item, index) => {
            const isActive = path === item.url || (item.url !== '/' && path.startsWith(item.url));
            return (
              <li key={index}>
                <a className={isActive ? 'nav-links active-link' : 'nav-links'} href={item.url}>
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
        <div className="nav-right">
          <a href="/concordance" className="nav-search-btn" aria-label="Search concordance">
            <i className="ti ti-search" />
          </a>
          <div className="MenuIcon" onClick={this.handleClick}>
            <i className={this.state.clicked ? 'ti ti-x' : 'ti ti-menu-2'} />
          </div>
        </div>
      </nav>
    );
  }
}

export default NavBar;
