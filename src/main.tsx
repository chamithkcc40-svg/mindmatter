import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { primeFallback } from './liquid-glass';
import './styles/index.css';

// Probe WebGL2 before the first paint so surfaces never flash unstyled.
primeFallback();

const container = document.getElementById('root');
if (!container) throw new Error('Root element was not found');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
