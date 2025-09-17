// frontend/src/components/StatsComponent.jsx

import React from 'react';
import './StatsComponent.css'; // हम इसकी CSS फाइल को भी बनाएंगे

// यह एक छोटा, स्थानीय कंपोनेंट है
const StatCard = ({ value, label }) => (
  <div className="stat-card">
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
);

function StatsComponent({ stats, isLoading }) {
  // अगर आँकड़े अभी लोड हो रहे हैं, तो लोडिंग स्टेट दिखाएं
  if (isLoading) {
    return <div className="stats-container loading">Loading live stats...</div>;
  }
  
  // अगर आँकड़े लोड नहीं हुए हैं या कोई त्रुटि है, तो कुछ भी न दिखाएं
  if (!stats) {
    return null; 
  }

  return (
    <div className="stats-container">
      <h2>Live Protocol Statistics</h2>
      <div className="stats-grid">
        <StatCard 
          value={stats.totalMembers} 
          label="Active Members" 
        />
        <StatCard 
          value={`$${parseFloat(stats.totalRewards).toLocaleString()}`}
          label="Total Rewards Distributed"
        />
        {/* आप भविष्य में यहाँ और भी आँकड़े जोड़ सकते हैं */}
      </div>
    </div>
  );
}

export default StatsComponent;