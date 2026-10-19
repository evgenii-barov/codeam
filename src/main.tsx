import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource-variable/unbounded';
import App from './App';
import SmoothScroll from './scroll/SmoothScroll';
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><SmoothScroll><App /></SmoothScroll></React.StrictMode>);
