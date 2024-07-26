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
          <h1 className="NavbarLogo"><a href="http://localhost:3000/">Site</a><i className=""></i></h1>
          <div className="MenuIcon" onClick={this.handleClick}>
            <i className={this.state.clicked ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'}></i>
          </div>
          <ul className={this.state.clicked ? 'nav-menu active' : 'nav-menu'}>
            {NavMenu.map((item, index)=> {
              return (
                <li key={index}>
                  <a className={item.cName} href={item.url}>
                    {item.title} {item.icon}
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

/* goes on line 30 above closing </ul> tag --- <li><i className="fa-solid fa-magnifying-glass"></i> </li> */
