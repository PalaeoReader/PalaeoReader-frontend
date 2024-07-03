import React from 'react';
import { createRoot } from 'react-dom/client';
import NavBar from './Components/NavBar/NavBar';
import './index.css';
import './Components/NavBar/NavBar.css'
import './Components/Login/Login.css';
import ArtifactList from './Components/ArtifactList';
import Login from './Components/Login/Login';
import ArtifactRow from './Components/ArtifactRow';
import './API';
import './APIurls';
import ArtifactDisplay from './Components/ArtifactDisplay';
import SwrImageData from './Components/ArtifactDisplay';

// Clear the existing HTML content
document.body.innerHTML = '<div id="root"></div>';

//window.addEventListener("load");
const domNode = document.getElementById('root');
export const root = createRoot(domNode);


function App() {
  return (
    <div className="container" color="#FBFFF1">
      <header className="header">
        <NavBar />
      </header>
      <ArtifactDisplay/>
    </div>
  );
}

root.render(<App />);
