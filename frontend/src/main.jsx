// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
// --- समाधान: Router को यहाँ इम्पोर्ट करें ---
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import AuthProvider from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* --- समाधान: Router को सबसे बाहरी कंपोनेंट बनाएं --- */}
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>,
)