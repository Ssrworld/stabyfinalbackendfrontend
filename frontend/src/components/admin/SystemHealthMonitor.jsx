// frontend/src/components/admin/SystemHealthMonitor.jsx
import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './SystemHealthMonitor.css';

const SERVICE_DEFINITIONS = {
    'POOL_ENGINE': { name: 'Pool Engine', expectedInterval: 2 * 60 * 1000 }, // 2 minutes
    'DEPOSIT_CHECKER': { name: 'Deposit Checker', expectedInterval: 3 * 60 * 1000 }, // 3 minutes
    'FUND_SWEEPER': { name: 'Fund Sweeper', expectedInterval: 2 * 60 * 1000 }, // 2 minutes
    'ACCOUNT_ACTIVATOR': { name: 'Account Activator', expectedInterval: 3 * 60 * 1000 }, // 3 minutes
    'PAYOUT_PROCESSOR': { name: 'Payout Processor', expectedInterval: 6 * 60 * 1000 }, // 6 minutes
};

const SystemHealthMonitor = () => {
    const [healthData, setHealthData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiService.getSystemHealth();
                setHealthData(response.data);
            } catch (error) {
                console.error("Failed to fetch system health:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // हर 30 सेकंड में रिफ्रेश करें
        return () => clearInterval(interval);
    }, []);

    const getStatus = (service) => {
        if (service.status === 'ERROR') {
            return { className: 'error', text: 'Error' };
        }
        const lastRun = new Date(service.last_run_timestamp).getTime();
        const now = new Date().getTime();
        const interval = SERVICE_DEFINITIONS[service.service_name]?.expectedInterval;

        if (interval && (now - lastRun > interval)) {
            return { className: 'late', text: 'Late' };
        }
        return { className: 'ok', text: 'OK' };
    };

    if (loading) return <div className="health-monitor-container">Loading System Health...</div>;

    return (
        <div className="health-monitor-container">
            <h3>System Health Monitor</h3>
            <div className="health-grid">
                {Object.keys(SERVICE_DEFINITIONS).map(serviceKey => {
                    const serviceData = healthData.find(s => s.service_name === serviceKey);
                    if (!serviceData) {
                        return (
                             <div className="health-card" key={serviceKey}>
                                <span className="service-name">{SERVICE_DEFINITIONS[serviceKey].name}</span>
                                <div className="status-indicator unknown"></div>
                                <span className="status-text">No Data</span>
                                <span className="last-run">Waiting for first run...</span>
                            </div>
                        )
                    }
                    const statusInfo = getStatus(serviceData);
                    return (
                        <div className="health-card" key={serviceData.service_name} title={serviceData.details || ''}>
                            <span className="service-name">{SERVICE_DEFINITIONS[serviceData.service_name].name}</span>
                            <div className={`status-indicator ${statusInfo.className}`}></div>
                            <span className="status-text">{statusInfo.text}</span>
                            <span className="last-run">
                                Last run: {new Date(serviceData.last_run_timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SystemHealthMonitor;