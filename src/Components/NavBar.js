import React, {Component} from 'react';
import {NavMenu} from './NavMenu';

class NavBar extends Component {
  state = {clicked:false }

  handleClick = () => {
    this.setState ({clicked: !this.state.clicked})
  }

  render() {
    return (
      <nav className="NavbarItems">
          <h1 className="NavbarLogo">Site<i className="fab fa-react"></i></h1>
          <div className="MenuIcon" onClick={this.handleClick}>
            <i className={this.state.clicked ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'}></i>
          </div>
          <ul className={this.state.clicked ? 'nav-menu active' : 'nav-menu'}>
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