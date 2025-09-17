import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './Admin.css';

function P2PTransferHistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiService.getAdminP2PTransfers()
            .then(res => setHistory(res.data))
            .catch(() => alert('Failed to load P2P transfer history.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="admin-page-container">
            <h1>P2P Fund Transfer History</h1>
            <p className="page-description">This log shows all peer-to-peer fund transfers between users.</p>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Sender</th>
                            <th>Recipient</th>
                            <th>Amount Received</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4">Loading history...</td></tr>
                        ) : history.length === 0 ? (
                            <tr><td colSpan="4">No P2P transfers have been made yet.</td></tr>
                        ) : history.map(tx => (
                            <tr key={tx.id}>
                                <td>{new Date(tx.created_at).toLocaleString()}</td>
                                <td>{tx.sender_email}</td>
                                <td>{tx.recipient_email}</td>
                                <td><b>${parseFloat(tx.amount).toFixed(2)}</b></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default P2PTransferHistoryPage;