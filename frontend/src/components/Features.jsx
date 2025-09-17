// frontend/src/components/Features.jsx (FINAL CORRECTED CODE)

import React from 'react';
import './Features.css';

const FeatureCard = ({ title, description, icon }) => (
  <div className="feature-card">
    <div className="feature-icon">
      {icon}
    </div>
    <div className="feature-text">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </div>
);

function Features() {
  return (
    // --- ✅ SAMADHAN: Yahaan se extra container div hata diya gaya hai ---
    <section className="features-section" id="features">
        <h2>Part of a Powerful Ecosystem</h2>
        <p className="section-subtitle">
            Our rewards program is built upon the foundation of the Stabylink Wallet, offering you a secure and versatile DeFi experience.
        </p>
        <div className="features-grid">
          <FeatureCard
            title="Multi-Chain Support"
            description="Seamlessly manage your assets across multiple blockchains including Ethereum, BSC, Polygon, and more. One wallet for all your needs."
            icon={<i className="fa-solid fa-link"></i>}
          />
          <FeatureCard
            title="Low Fees, Fast Execution"
            description="Our optimized transaction routing ensures you always get the best rates with minimal gas fees and lightning-fast confirmation times."
            icon={<i className="fa-solid fa-bolt"></i>}
          />
          <FeatureCard
            title="100% Decentralized"
            description="You are in complete control. Your private keys are encrypted and stored only on your device. We never have access to your funds."
            icon={<i className="fa-solid fa-shield-halved"></i>}
          />
           <FeatureCard
            title="Community Governed"
            description="Stabylink is built for the community, by the community. Participate in governance and shape the future of our ecosystem."
            icon={<i className="fa-solid fa-users"></i>}
          />
        </div>
    </section>
  );
}

export default Features;