// frontend/src/pages/admin/ActivityLogPage.jsx

import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './Admin.css';

function ActivityLogPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        apiService.getAdminActivityLogs()
            .then(response => setLogs(response.data))
            .catch(() => setError('Failed to load activity logs.'))
            .finally(() => setLoading(false));
    }, []);

    const formatDetails = (log) => {
        if (!log.details) return 'N/A';
        try {
            const parsed = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            // ईमेल रिपोर्ट के लिए विशेष रेंडरिंग
            if (log.action_type === 'BULK_EMAIL_SENT') {
                return (
                    <div>
                        <strong>Subject:</strong> {parsed.subject}<br/>
                        <strong>Status:</strong> Sent to {parsed.successCount} of {parsed.totalAttempted} users.
                    </div>
                );
            }
            return <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontSize: '0.8rem'}}>{JSON.stringify(parsed, null, 2)}</pre>;
        } catch {
            return log.details;
        }
    };

    if (loading) return <div className="admin-page-container">Loading Activity Logs...</div>;
    if (error) return <div className="admin-page-container error-message">{error}</div>;

    return (
        <div className="admin-page-container">
            <h1>Admin Activity Log</h1>
            <p>Showing the last 100 actions performed by administrators, including bulk email reports.</p>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Admin</th>
                            <th>Action Type</th>
                            <th>Target User</th>
                            <th>Details / Report</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? logs.map(log => (
                            <tr key={log.id}>
                                <td>{new Date(log.created_at).toLocaleString()}</td>
                                <td>{log.admin_email}</td>
                                <td><span className="action-type-badge">{log.action_type.replace(/_/g, ' ')}</span></td>
                                <td>{log.target_user_email || 'N/A'}</td>
                                <td style={{maxWidth: '400px'}}>{formatDetails(log)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No activity logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ActivityLogPage;