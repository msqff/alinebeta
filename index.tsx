
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import StandaloneDPP from './components/StandaloneDPP';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const urlParams = new URLSearchParams(window.location.search);
const dppData = urlParams.get('dpp');

if (dppData) {
    try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(dppData))));
        root.render(
            <React.StrictMode>
                <StandaloneDPP data={decoded} />
            </React.StrictMode>
        );
    } catch (e) {
        console.error("Failed to parse DPP data from URL", e);
        root.render(<div className="p-8 text-red-500 font-bold bg-slate-900 min-h-screen">Invalid DPP Data Link</div>);
    }
} else {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
}
