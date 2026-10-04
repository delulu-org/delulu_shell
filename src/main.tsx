import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initProductionGuard } from './utils/productionGuard';
import App from './App';

initProductionGuard();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
