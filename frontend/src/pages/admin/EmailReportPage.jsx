import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { toast } from 'react-toastify';
import './Admin.css';

const StatusBadge = ({ status }) => {
    let className = 'status-badge';
    if (status === 'SENT') className += ' active';
    else if (status === 'FAILED') className += ' suspended';
    else className += ' pending';
    return <span className={className}>{status}</span>;
};

const EmailReportPage = () => {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiService.getEmailQueue()
            .then(res => setEmails(res.data))
            .catch(() => toast.error("Failed to load email report."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="admin-page-container">
            <h1>Email Delivery Report</h1>
            <p className="page-description">Showing the status of the last 100 emails processed by the system.</p>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Date Queued</th>
                            <th>Recipient</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Attempts</th>
                            <th>Last Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6">Loading...</td></tr>
                        ) : emails.map(email => (
                            <tr key={email.id}>
                                <td>{new Date(email.created_at).toLocaleString()}</td>
                                <td>{email.recipient_email}</td>
                                <td>{email.subject}</td>
                                <td><StatusBadge status={email.status} /></td>
                                <td>{email.attempts}</td>
                                <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{email.last_error}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmailReportPage;
