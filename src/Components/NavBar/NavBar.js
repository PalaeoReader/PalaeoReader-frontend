import React, { Component } from 'react';
import { NavMenu } from './NavMenu';
import { useAuth } from '../../Auth/AuthContext';
import config from '../../config';

function initials(user) {
  const name = user.full_name || user.email || '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function displayName(user) {
  return user.full_name || user.email;
}

function UserMenu({ user, logout }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className={`user-menu${open ? ' open' : ''}`} ref={ref}>
      <button className="user-menu-trigger" onClick={() => setOpen(v => !v)}>
        <span className="user-avatar">{initials(user)}</span>
        <span className="user-menu-name">{displayName(user)}</span>
        <i className="ti ti-chevron-down" />
      </button>
      {open && (
        <div className="user-menu-dropdown">
          <a className="user-menu-item" href="/settings">Settings</a>
          <div className="user-menu-divider" />
          <button className="user-menu-item" onClick={() => { setOpen(false); logout(); }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function NavAuth() {
  const auth = useAuth();
  if (!auth || auth.loading) return null;
  if (auth.user) return <UserMenu user={auth.user} logout={auth.logout} />;
  return (
    <div className="nav-auth-btns">
      <a href="/signin" className="nav-btn nav-btn-outline">Sign in</a>
      <a href="/signup" className="nav-btn nav-btn-filled">Create account</a>
    </div>
  );
}

class NavBar extends Component {
  state = { clicked: false }

  handleClick = () => {
    this.setState({ clicked: !this.state.clicked });
  }

  render() {
    const path = window.location.pathname;
    return (
      <nav className="NavbarItems">
        <h1 className="NavbarLogo"><a href="/">{config.projectName}</a></h1>
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
          <NavAuth />
          <div className="MenuIcon" onClick={this.handleClick}>
            <i className={this.state.clicked ? 'ti ti-x' : 'ti ti-menu-2'} />
          </div>
        </div>
      </nav>
    );
  }
}

export default NavBar;
