import React, {Component} from 'react';
import {NavMenu} from './NavMenu';
import {Button} from './Button';

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
          <Button></Button>
      </nav>
    )
  }
}


export default NavBar;