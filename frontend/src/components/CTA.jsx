import React from 'react';
import { Link } from 'react-router-dom';
import './CTA.css';

function CTA() {
  return (
    <section className="cta-section">
      <div className="cta-content">
        <h2>Ready to Activate Your Potential?</h2>
        <p>
          Become a part of a revolutionary financial protocol. The next pool is filling up now.
        </p>
        <Link to="/register" className="btn btn-primary">
          Join the Community
        </Link>
      </div>
    </section>
  );
}

export default CTA;