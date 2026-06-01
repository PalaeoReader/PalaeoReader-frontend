import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './Components/NavBar/NavBar.css';
import NavBar from './Components/NavBar/NavBar';
import MainPage from './Components/Home/MainPage';
import ArtifactList from './Components/ArtifactDirectory/ArtifactList';
import ArtifactDisplay from './Components/ArtifactPage/ArtifactDisplay';
import MapPage from './Components/Map/MapPage';
import DictionaryPage from './Components/Dictionary/DictionaryPage';
import SourcesPage from './Components/Sources/SourcesPage';
import Login from './Components/Login/Login';
import './Components/Login/Login.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';

document.body.innerHTML = '<div id="root"></div>';
const domNode = document.getElementById('root');
export const root = createRoot(domNode);

function App() {
  return (
    <div>
      <Router>
        <header>
          <NavBar />
        </header>
        <Routes>
          <Route path="/"                    element={<MainPage />}       />
          <Route path="/directory"           element={<ArtifactList />}   />
          <Route path="/artifact/:shortName" element={<ArtifactDisplay />}/>
          <Route path="/map"                 element={<MapPage />}        />
          <Route path="/dictionary"          element={<DictionaryPage />} />
          <Route path="/sources"             element={<SourcesPage />}    />
          <Route path="/login"               element={<Login />}          />
        </Routes>
      </Router>
    </div>
  );
}

root.render(<App />);
