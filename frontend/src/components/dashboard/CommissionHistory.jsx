// frontend/src/components/dashboard/CommissionHistory.jsx

import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import EmptyState from '../EmptyState';

const CommissionHistory = ({ isOpen }) => {
    const [commissions, setCommissions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && commissions.length === 0) {
            setIsLoading(true);
            apiService.getCommissionHistory()
                .then(res => setCommissions(res.data))
                .catch(err => console.error("Failed to fetch commission history", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, commissions.length]);

    return (
        <div className="info-card full-width inside-accordion">
            {isLoading ? (
                <p className="loading-text">Loading commission history...</p>
            ) : !Array.isArray(commissions) || commissions.length === 0 ? (
                <EmptyState message="You have not earned any direct commissions yet." icon="fa-hand-holding-dollar" />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Commission</th>
                                <th>From User</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissions.map((tx, index) => (
                                <tr key={index}>
                                    <td>{new Date(tx.created_at).toLocaleString()}</td>
                                    <td><strong>${parseFloat(tx.amount).toFixed(2)}</strong></td>
                                    <td>{tx.referred_user_email}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CommissionHistory;
