import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import EmptyState from '../EmptyState';
import '../../pages/DashboardPage.css'; // ✅✅✅ सही पाथ

const PromoterCommissionHistory = ({ isOpen }) => {
    const [commissions, setCommissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && commissions.length === 0) {
            setIsLoading(true);
            apiService.getPromoterCommissions()
                .then(res => setCommissions(res.data))
                .catch(err => console.error("Failed to fetch promoter commission history", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, commissions.length]);

    if (!isOpen) return null;

    return (
        <div className="info-card full-width inside-accordion">
            {isLoading ? (
                <p className="loading-text">Loading your promoter commissions...</p>
            ) : !commissions || commissions.length === 0 ? (
                <EmptyState message="You have not earned any promoter commissions yet." icon="fa-hand-holding-dollar" />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>From User</th>
                                <th>Type</th>
                                <th>USDT Earned</th>
                                <th>STBL Earned</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissions.map((tx) => (
                                <tr key={tx.id}>
                                    <td>{new Date(tx.created_at).toLocaleString()}</td>
                                    <td>{tx.from_user_email}</td>
                                    <td>
                                        <span className="transaction-type-badge" style={{textTransform: 'capitalize'}}>
                                            {tx.commission_type.replace(/_/g, ' ').toLowerCase()}
                                        </span>
                                    </td>
                                    <td><strong>${parseFloat(tx.commission_amount).toFixed(2)}</strong></td>
                                    <td><strong>{parseFloat(tx.token_commission_amount).toLocaleString()} STBL</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PromoterCommissionHistory;