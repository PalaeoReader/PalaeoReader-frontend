import { createRoot } from 'react-dom/client';

// Clear the existing HTML content
document.body.innerHTML = '<div id="app"></div>';

// Render your React component instead
const root = createRoot(document.getElementById('app'));
root.render(<h1>Hello, world</h1>);

//window.addEventListener("load");

function Submit() {
  
  return (
  <button>Submit</button>
)}

function App() {
  return (
 <Submit />
  );
}

root.render(<App />);
