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
          <h1 className="NavbarLogo">Site<i className=""></i></h1>
          <div className="MenuIcon" onClick={this.handleClick}>
            <i className={this.state.clicked ? 'fa-solid fa-bars' : 'fa-solid fa-xmark'}></i>
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


export default NavBar;