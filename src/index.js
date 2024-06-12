import React from 'react';
import { createRoot } from 'react-dom/client';
import NavBar from './Components/NavBar';
import './index.css';
import ArtifactList from './Components/ArtifactList';
import Login from './Components/Login';

// Clear the existing HTML content
document.body.innerHTML = '<div id="root"></div>';

// Render your React component instead
//const root = createRoot(document.getElementById('app'));
//root.render(<h1>Hello, world</h1>);

//window.addEventListener("load");
const domNode = document.getElementById('root');
const root = createRoot(domNode);

function App() {
  return (
    <div className="container" color="#FBFFF1">
      <header className="header">
        <h1>Log in</h1>
      </header>
      <Login />
    </div>
  );
}

root.render(<App />);
