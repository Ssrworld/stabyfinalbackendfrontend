// frontend/src/components/Footer.jsx (FIXED)

import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>Stabylink</h3>
          <p>Automated Rewards Protocol.</p>
          <div className="social-links">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
            </a>
            <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <i className="fab fa-telegram"></i>
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                <i className="fab fa-discord"></i>
            </a>
          </div>
        </div>
        <div className="footer-links">
          <h4>Navigate</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </ul>
        </div>
        
        {/* --- ✅ समाधान: नया सपोर्ट सेक्शन यहाँ जोड़ें --- */}
        <div className="footer-links">
          <h4>Support</h4>
          <ul>
            <li>
                <a href="mailto:support@stabylink.com">support@stabylink.com</a>
            </li>
            <li><Link to="/faq">FAQ</Link></li> {/* FAQ का लिंक जोड़ना भी एक अच्छा विचार है */}
          </ul>
        </div>

        <div className="footer-legal">
          <h4>Legal</h4>
          <p>&copy; {new Date().getFullYear()} Stabylink. All rights reserved.</p>
          <p>This is not financial advice. Participate at your own risk.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;