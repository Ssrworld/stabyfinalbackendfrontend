// frontend/src/components/Hero.jsx (UPDATED)

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

function Hero() {
  const [vantaEffect, setVantaEffect] = useState(null);
  const vantaRef = useRef(null);

  useEffect(() => {
    let effect = null;
    if (window.VANTA) {
      effect = window.VANTA.NET({
        el: vantaRef.current, THREE: window.THREE,
        mouseControls: true, touchControls: true, gyroControls: false,
        minHeight: 200.00, minWidth: 200.00, scale: 1.00, scaleMobile: 1.00,
        color: 0x7e22ce, backgroundColor: 0x0d0c22,
        points: 12.00, maxDistance: 25.00, spacing: 18.00
      });
      setVantaEffect(effect);
    }
    return () => { if (effect) effect.destroy(); };
  }, []);

  return (
    <div className="hero-container" ref={vantaRef}>
      <div className="hero-content">
        <img src="/logo.svg" alt="Stabylink Main Logo" className="hero-main-logo" />
        
        <h1>
          Join Our Ecosystem & Earn Up To <span className="highlight">$20,410 & 10000 STBL</span> in Rewards
        </h1>
        
        <p className="hero-subheading">
           <span className="bonus-amount">Special bonus for community builders </span> 
        </p>
        
        <p className="subtitle">
          The Stabylink Wallet is your gateway to decentralized finance. Our Community Rewards Program allows you to earn by helping us grow, with special bonuses for top referrers.
        </p>

        {/* --- ✅ समाधान: यहाँ बटन ग्रुप को अपडेट किया गया है --- */}
        <div className="hero-buttons">
            <Link to="/register" className="btn-primary">
                Join Rewards Program
            </Link>
            
            {/* नया व्हाइटपेपर डाउनलोड बटन */}
            <a 
                href="/Stabylink-Whitepaper.pdf" // यह public फोल्डर में रखी गई फाइल को इंगित करता है
                download="Stabylink-Whitepaper.pdf" // यह ब्राउज़र को फाइल डाउनलोड करने के लिए कहता है
                className="btn-secondary"
            >
                <i className="fa-solid fa-file-pdf" style={{ marginRight: '0.5rem' }}></i>
                Download Whitepaper
            </a>
            
            {/* यह बटन अब तीसरे स्थान पर है */}
            <a href="https://stabylink.com" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                Explore Stabylink Wallet
            </a>
        </div>
      </div>
      <a href="#stats" className="scroll-down-arrow" aria-label="Scroll down">
        <i className="fa-solid fa-chevron-down"></i>
      </a>
    </div>
  );
}

export default Hero;