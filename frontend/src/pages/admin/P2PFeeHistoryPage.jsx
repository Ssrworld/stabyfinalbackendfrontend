import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './Admin.css';

function P2PFeeHistoryPage() {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiService.getAdminP2PFees()
            .then(res => setFees(res.data))
            .catch(() => alert('Failed to load P2P fee history.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="admin-page-container">
            <h1>P2P Transfer Fee Earnings</h1>
            <p className="page-description">This log shows all fees collected from P2P transfers made from users' withdrawable balances.</p>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>From User</th>
                            <th>Fee Amount</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4">Loading fee history...</td></tr>
                        ) : fees.length === 0 ? (
                            <tr><td colSpan="4">No fees have been collected from P2P transfers yet.</td></tr>
                        ) : fees.map(fee => (
                            <tr key={fee.id}>
                                <td>{new Date(fee.created_at).toLocaleString()}</td>
                                <td>{fee.from_user_email}</td>
                                <td><b>${parseFloat(fee.amount).toFixed(2)}</b></td>
                                <td>{fee.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default P2PFeeHistoryPage;