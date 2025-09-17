// frontend/src/components/dashboard/WithdrawalHistory.jsx

import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import EmptyState from '../EmptyState';

const WithdrawalHistory = ({ isOpen }) => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && withdrawals.length === 0) {
            setIsLoading(true);
            apiService.getWithdrawalHistory()
                .then(res => setWithdrawals(res.data))
                .catch(err => console.error("Failed to fetch withdrawal history", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, withdrawals.length]);


    return (
        <div className="info-card full-width inside-accordion">
            {isLoading ? (
                <p className="loading-text">Loading history...</p>
            ) : !Array.isArray(withdrawals) || withdrawals.length === 0 ? (
                <EmptyState message="You have no withdrawal history yet." icon="fa-receipt" />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Requested</th>
                                <th>Fee (10%)</th>
                                <th>You Received</th>
                                <th>Status</th>
                                <th>Transaction Hash</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.map((tx, index) => (
                                <tr key={index}>
                                    <td>{new Date(tx.created_at).toLocaleString()}</td>
                                    <td>${parseFloat(tx.amount).toFixed(2)}</td>
                                    <td>${parseFloat(tx.admin_fee).toFixed(2)}</td>
                                    <td><b>${parseFloat(tx.final_amount).toFixed(2)}</b></td>
                                    <td><span className={`status-badge ${tx.status.toLowerCase()}`}>{tx.status}</span></td>
                                    <td>
                                        {tx.tx_hash ? (
                                            <a href={`https://bscscan.com/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer" title={tx.tx_hash}>
                                                {`${tx.tx_hash.substring(0, 8)}...${tx.tx_hash.substring(tx.tx_hash.length - 6)}`}
                                            </a>
                                        ) : (
                                            <span>{tx.status === 'PENDING' ? 'Processing...' : 'N/A'}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default WithdrawalHistory;
