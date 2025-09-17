// frontend/src/components/DashboardSkeleton.jsx
import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const DashboardSkeleton = () => (
    <div className="dashboard-container">
      <div className="dashboard-overlay">
        <p className="welcome-message"><Skeleton width={300} /></p>
        <div className="dashboard-grid">
            <div className="info-card"><Skeleton height={80} /></div>
            <div className="info-card"><Skeleton height={80} /></div>
            <div className="info-card"><Skeleton height={80} /></div>
            <div className="info-card full-width"><Skeleton height={150} /></div>
            <div className="info-card"><Skeleton height={180} /></div>
            <div className="info-card"><Skeleton height={180} /></div>
            <div className="info-card"><Skeleton height={180} /></div>
        </div>
      </div>
    </div>
);

export default DashboardSkeleton;