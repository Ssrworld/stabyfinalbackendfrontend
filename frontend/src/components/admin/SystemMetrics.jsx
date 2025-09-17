import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './SystemHealthMonitor.css'; // हम उसी CSS का पुन: उपयोग करेंगे

const MetricCard = ({ title, value, status, unit = '' }) => {
    let statusClass = 'ok';
    if (status === 'WARNING') statusClass = 'late';
    if (status === 'ERROR') statusClass = 'error';
    if (status === 'INFO') statusClass = 'unknown';

    return (
        <div className="health-card metric-card" title={`Status: ${status}`}>
            <span className="service-name">{title}</span>
            <div className={`status-indicator ${statusClass}`} style={{animation: 'none'}}></div>
            <span className="metric-value">{value} {unit}</span>
        </div>
    );
};

const SystemMetrics = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await apiService.getSystemMetrics();
                setMetrics(response.data);
            } catch (error) {
                console.error("Failed to fetch system metrics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // हर 30 सेकंड में रिफ्रेश करें
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="health-monitor-container">Loading System Metrics...</div>;
    if (!metrics) return null;

    return (
        <div className="health-monitor-container">
            <h3>System Metrics</h3>
            <div className="health-grid">
                <MetricCard 
                    title="Pending Withdrawals"
                    value={metrics.pendingWithdrawals.count}
                    status={metrics.pendingWithdrawals.status}
                />
                <MetricCard 
                    title="Failed Withdrawals"
                    value={metrics.failedWithdrawals.count}
                    status={metrics.failedWithdrawals.status}
                />
                <MetricCard 
                    title="Unplaced User Queue"
                    value={metrics.unplacedQueue.count}
                    status={metrics.unplacedQueue.status}
                />
                <MetricCard 
                    title="Last Deposit Seen"
                    value={metrics.lastDepositTimestamp.value !== 'Never' ? new Date(metrics.lastDepositTimestamp.value).toLocaleTimeString() : 'Never'}
                    status={metrics.lastDepositTimestamp.status}
                />
                 <MetricCard 
                    title="Hot Wallet Balance"
                    value={metrics.hotWalletBalance.value}
                    status={metrics.hotWalletBalance.status}
                    unit="BNB"
                />
            </div>
        </div>
    );
};

export default SystemMetrics;