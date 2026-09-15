import {StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {App} from './App';

const root = document.getElementById('root')!;
const year = Number(root.dataset.taraRenderYear);
if (!Number.isInteger(year) || year < 2026) throw new Error('Missing homepage render year');
hydrateRoot(root, <StrictMode><App year={year} /></StrictMode>);
