// frontend/src/components/dashboard/DepositHistory.jsx

import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import EmptyState from '../EmptyState';

const DepositHistory = ({ isOpen }) => {
    const [deposits, setDeposits] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && deposits.length === 0) {
            setIsLoading(true);
            apiService.getDepositHistory()
                .then(res => setDeposits(res.data))
                .catch(err => console.error("Failed to fetch deposit history", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, deposits.length]);

    return (
        <div className="info-card full-width inside-accordion">
            {isLoading ? (
                <p className="loading-text">Loading history...</p>
            ) : !Array.isArray(deposits) || deposits.length === 0 ? (
                <EmptyState message="No deposit history found." icon="fa-file-invoice-dollar" />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Transaction Hash</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deposits.map((tx, index) => (
                                <tr key={index}>
                                    <td>{new Date(tx.created_at).toLocaleString()}</td>
                                    <td>${parseFloat(tx.amount).toFixed(2)} USDT</td>
                                    <td><span className="status-badge verified">Verified</span></td>
                                    <td>
                                        {tx.tx_hash && tx.tx_hash.startsWith('0x') ? (
                                            <a href={`https://bscscan.com/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer" title={tx.tx_hash}>
                                                {`${tx.tx_hash.substring(0, 8)}...${tx.tx_hash.substring(tx.tx_hash.length - 6)}`}
                                            </a>
                                        ) : (
                                            <span>{tx.tx_hash}</span>
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

export default DepositHistory;
