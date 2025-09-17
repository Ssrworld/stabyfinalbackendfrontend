// frontend/src/pages/HomePage.jsx (FINAL AND CORRECTED CODE)

import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import StatsComponent from '../components/StatsComponent';
import RewardRoadmap from '../components/RewardRoadmap';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import FAQ from '../components/FAQ';
import GlobalAnnouncementModal from '../components/GlobalAnnouncementModal'; // Updated import
import apiService from '../services/api';

function HomePage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiService.getPublicStats();
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch public stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="homepage">
      <Hero />
      <div className="homepage-content">
        
        {/* Is component ko call karne se hi modal ka logic kaam karega */}
        <GlobalAnnouncementModal />
        
        <div id="stats" className="section-container">
          <StatsComponent stats={stats} isLoading={isLoading} />
        </div>
        
        <div className="section-container">
            <Features />
        </div>
        
        <div className="section-container">
            <HowItWorks />
        </div>

        <div className="section-container">
            <FAQ />
        </div>
        
        <div className="section-container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Visualize Your Earning Potential</h2>
          <p className="section-subtitle">Earn up to $20,410 by completing all 10 reward stages.</p>
          <RewardRoadmap currentReward={0} />
        </div>
        
        <CTA />
      </div>
      
      <Footer />
    </div>
  );
}

export default HomePage;
