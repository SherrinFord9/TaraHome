import {StrictMode} from 'react';
import {renderToString} from 'react-dom/server';
import {App} from './App';

export function renderHome(year: number) {
  return renderToString(<StrictMode><App year={year} /></StrictMode>);
}
