// frontend/src/components/dashboard/FundTransferHistory.jsx
import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import EmptyState from '../EmptyState';

const FundTransferHistory = ({ isOpen }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && history.length === 0) {
            setIsLoading(true);
            apiService.getFundTransferHistory()
                .then(res => setHistory(res.data))
                .catch(err => console.error("Failed to fetch fund transfer history", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, history.length]);


    return (
        <div className="info-card full-width inside-accordion">
            {isLoading ? (
                <p className="loading-text">Loading history...</p>
            ) : !Array.isArray(history) || history.length === 0 ? (
                <EmptyState message="You have no fund transfer history yet." icon="fa-exchange-alt" />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>From/To</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(tx => (
                                <tr key={tx.id}>
                                    <td>{new Date(tx.date).toLocaleString()}</td>
                                    <td>
                                        <span className={`tx-type-badge ${tx.type === 'Sent' ? 'withdrawal' : 'deposit'}`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td><b>${tx.amount}</b></td>
                                    <td>{tx.counterparty}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FundTransferHistory;
