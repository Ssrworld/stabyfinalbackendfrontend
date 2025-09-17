// frontend/src/pages/admin/WithdrawalManagementPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/api';
import { toast } from 'react-toastify';
import './Admin.css';

function WithdrawalManagementPage() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPendingWithdrawals = useCallback(() => {
        setLoading(true);
        apiService.getPendingWithdrawals()
            .then(response => setWithdrawals(response.data))
            .catch(() => setError('Failed to load pending withdrawals.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchPendingWithdrawals();
    }, [fetchPendingWithdrawals]);

    const handleReject = async (withdrawalId) => {
        if (!window.confirm(`Are you sure you want to reject withdrawal #${withdrawalId}? This will return the funds to the user's balance.`)) {
            return;
        }

        try {
            const response = await apiService.updateWithdrawalStatus(withdrawalId, { status: 'FAILED' });
            toast.success(response.data.message);
            fetchPendingWithdrawals(); // Refresh the list
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject withdrawal.');
        }
    };

    if (loading) return <div className="admin-page-container">Loading Pending Withdrawals...</div>;
    if (error) return <div className="admin-page-container error-message">{error}</div>;

    return (
        <div className="admin-page-container">
            <h1>Pending Withdrawals</h1>
            <p>Review and manage withdrawals that are awaiting automatic processing. You can manually reject a withdrawal if needed.</p>
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>User Email</th>
                            <th>Requested Amount</th>
                            <th>Amount to Send</th>
                            <th>Payout Wallet</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {withdrawals.length > 0 ? withdrawals.map(wd => (
                            <tr key={wd.id}>
                                <td>{wd.id}</td>
                                <td>{new Date(wd.created_at).toLocaleString()}</td>
                                <td>{wd.email}</td>
                                <td>${parseFloat(wd.amount).toFixed(2)}</td>
                                <td><b>${parseFloat(wd.final_amount).toFixed(2)}</b></td>
                                <td className="wallet-address">{wd.payout_wallet}</td>
                                <td>
                                    <button onClick={() => handleReject(wd.id)} className="btn-action" style={{backgroundColor: '#f44336'}}>
                                        <i className="fa-solid fa-times"></i> Reject
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>
                                    No pending withdrawals at the moment.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default WithdrawalManagementPage;