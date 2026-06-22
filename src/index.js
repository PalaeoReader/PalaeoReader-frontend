import React from 'react';
import { createRoot } from 'react-dom/client';
import '@coreui/coreui/dist/css/coreui.min.css';
import './index.css';
import './Components/NavBar/NavBar.css';
import NavBar from './Components/NavBar/NavBar';
import MainPage from './Components/Home/MainPage';
import ArtifactList from './Components/ArtifactDirectory/ArtifactList';
import ArtifactDisplay from './Components/ArtifactPage/ArtifactDisplay';
import MapPage from './Components/Map/MapPage';
import DictionaryPage from './Components/Dictionary/DictionaryPage';
import SourcesPage from './Components/Sources/SourcesPage';
import ConcordancePage from './Components/Concordance/ConcordancePage';
import Login from './Components/Login/Login';
import './Components/Login/Login.css';
import DivisionView from './Components/DivisionView/DivisionView';
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
          <Route path="/concordance"         element={<ConcordancePage />}/>
          <Route path="/login"               element={<Login />}          />
          <Route path="/divisions/:id"       element={<DivisionView />}   />
        </Routes>
      </Router>
    </div>
  );
}

root.render(<App />);
