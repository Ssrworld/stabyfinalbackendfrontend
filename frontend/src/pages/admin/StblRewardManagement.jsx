// frontend/src/pages/admin/StblRewardManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import './Admin.css';

function StblRewardManagement() {
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRewards = useCallback(() => {
        setLoading(true);
        apiService.getAdminStblRewards()
            .then(response => setRewards(response.data))
            .catch(() => toast.error('Failed to fetch rewards.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    // --- समाधान: handleUpdateStatus फंक्शन को हटा दिया गया है क्योंकि यह अब आवश्यक नहीं है ---

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString() : 'N/A';

    return (
        <div className="admin-page-container">
            <h1>STBL Token Reward Management</h1>
            <p className="page-description">
                Monitor all STBL token rewards awarded to users. 
                Transfers for rewards with status 'PENDING TRANSFER' are processed automatically by the system.
            </p>
            <div className="admin-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>User Email</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payout Wallet</th>
                            <th>Tx Hash</th>
                            <th>Awarded On</th>
                            {/* --- समाधान: एक्शन कॉलम हटा दिया गया --- */}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading rewards...</td></tr>
                        ) : rewards.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No rewards found.</td></tr>
                        ) : rewards.map(reward => (
                            <tr key={reward.id}>
                                <td>{reward.email}</td>
                                <td>{parseFloat(reward.amount).toLocaleString()} STBL</td>
                                <td><span className={`status-badge ${reward.status.toLowerCase().replace('_', '-')}`}>{reward.status.replace('_', ' ')}</span></td>
                                <td className="wallet-address">{reward.payout_wallet_address || 'Not Provided'}</td>
                                <td className="wallet-address">{reward.tx_hash ? (<a href={`https://bscscan.com/tx/${reward.tx_hash}`} target="_blank" rel="noopener noreferrer">{`${reward.tx_hash.substring(0, 8)}...`}</a>) : 'N/A'}</td>
                                <td>{formatDate(reward.created_at)}</td>
                                {/* --- समाधान: एक्शन सेल हटा दिया गया --- */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default StblRewardManagement;