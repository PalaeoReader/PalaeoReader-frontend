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
import AboutPage from './Components/About/AboutPage';
import ConcordancePage from './Components/Concordance/ConcordancePage';
import DivisionView from './Components/DivisionView/DivisionView';
import SignIn from './Components/Auth/SignIn';
import SignUp from './Components/Auth/SignUp';
import ForgotPassword from './Components/Auth/ForgotPassword';
import Settings from './Components/Auth/Settings';
import { AuthProvider } from './Auth/AuthContext';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import config from './config';

document.title = config.projectName;

document.body.innerHTML = '<div id="root"></div>';
const domNode = document.getElementById('root');
export const root = createRoot(domNode);

function App() {
  return (
    <div>
      <AuthProvider>
        <Router>
          <header className="site-header">
            <NavBar />
          </header>
          <Routes>
            <Route path="/"                    element={<MainPage />}       />
            <Route path="/directory"           element={<ArtifactList />}   />
            <Route path="/artifact/:shortName" element={<ArtifactDisplay />}/>
            <Route path="/map"                 element={<MapPage />}        />
            <Route path="/dictionary"          element={<DictionaryPage />} />
            <Route path="/sources"             element={<SourcesPage />}    />
            <Route path="/about"               element={<AboutPage />}      />
            <Route path="/concordance"         element={<ConcordancePage />}/>
            <Route path="/signin"              element={<SignIn />}         />
            <Route path="/signup"              element={<SignUp />}         />
            <Route path="/forgot-password"     element={<ForgotPassword />} />
            <Route path="/settings"            element={<Settings />}       />
            <Route path="/login"               element={<Navigate to="/signin" replace />} />
            <Route path="/divisions/:id"       element={<DivisionView />}   />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

root.render(<App />);
