// frontend/src/components/HowItWorks.jsx

import React from 'react';
import './HowItWorks.css';

function HowItWorks() {
  return (
    <section className="how-it-works-section" id="how-it-works"> {/* id जोड़ा गया */}
      <div className="section-container">
        <h2>A Simple Path to Rewards</h2>
        <p className="section-subtitle">
          {/* --- समाधान: यहाँ Markdown को HTML <strong> टैग से बदला गया है --- */}
          A simple, powerful path to earning rewards. Join, refer, and watch your earnings grow as your team expands. Your total potential earnings can reach up to <strong>$20,410!</strong>
        </p>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-icon">1</div>
            <h3>Join with $20</h3>
            {/* --- समाधान: यहाँ भी <strong> टैग का उपयोग किया गया है --- */}
            <p>A one-time <strong>$20 USDT</strong> contribution activates your position and unlocks your personal referral link.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">2</div>
            <h3>Earn Instant $5 Commission!</h3>
            {/* --- समाधान: यहाँ भी <strong> टैग का उपयोग किया गया है --- */}
            <p>For every person you directly refer, you get <strong>$5 instantly</strong>. Refer just 4 people, and you've already recovered your initial contribution.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">3</div>
            <h3>Team Up & Grow</h3>
            {/* --- समाधान: यहाँ भी <strong> टैग का उपयोग किया गया है --- */}
            <p>As your team grows (with 3 members), you complete <strong>Reward Stages</strong>. Your team follows you, unlocking bigger rewards at each new stage.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;