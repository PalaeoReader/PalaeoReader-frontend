import { Config } from './types';
import logo from './assets/logo.png';

const config = {
  projectName: 'PalaeoReader',
   // short description shown under the project name on the homepage
  tagline: 'Browse, read, and analyse ancient inscriptions and manuscripts with multi-source scholarly commentary and morphological annotation.',

  // text for the About page (placeholder for now)
  about: 'this is the about page',

   // backend server address; uses env var if set, else local default
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001',

  // logo shown in the navbar
  logo: logo,
} as Config;

// builds a full backend URL from a relative path, e.g. apiUrl('/api/artifacts/') -> http://127.0.0.1:8001/api/artifacts/
  export function apiUrl(path: string): string {
  return `${config.apiBaseUrl}${path}`;
}

export default config;
