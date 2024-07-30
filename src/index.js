import React from 'react';
import { createRoot } from 'react-dom/client';
import NavBar from './Components/NavBar/NavBar';
import './index.css';
import './Components/NavBar/NavBar.css'
import './Components/Login/Login.css';
import ArtifactList from './Components/ArtifactDirectory/ArtifactList';
import Login from './Components/Login/Login';
import Selection from './Components/Selections';
import './API';
import './APIurls';
import ArtifactDisplay from './Components/ArtifactPage/ArtifactDisplay';
import MainPage from './Components/Home/MainPage';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { useParams } from 'react-router-dom';

// Clear the existing HTML content
document.body.innerHTML = '<div id="root"></div>';

const domNode = document.getElementById('root');
export const root = createRoot(domNode);

function App() {
  return (
    <div className="container" color="#FBFFF1">
      <Router>
      <header className="header">
        <NavBar />
      </header>
            <Routes>
                <Route exact path="/" element={<MainPage/>}/>
                <Route exact path="/directory" element={<ArtifactList />} />
                <Route
                    path="/:shortName"
                    element={<ArtifactDisplay />}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/image/:id" element={<Selection />} />
            </Routes>
        </Router>
    </div>
  );
}

root.render(<App/>);
