import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept unhandled promise rejections and errors gracefully
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection captured gracefully:', event.reason);
  // Prevent default error reporting/overlay for handled rejections
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.warn('Runtime error captured gracefully:', event.message || event.error);
});

createRoot(document.getElementById('root')!).render(<App />);
