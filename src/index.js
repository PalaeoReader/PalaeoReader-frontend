import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ArtifactList from './Components/ArtifactList';

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
    <div className="container">
      <header className="header">
        <h1>Artifacts</h1>
      </header>
      <ArtifactList />
    </div>
  );
}

root.render(<App />);
