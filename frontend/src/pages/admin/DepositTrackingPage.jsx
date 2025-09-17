import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/api';
import './Admin.css'; // हम मौजूदा स्टाइल का पुन: उपयोग करेंगे

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

const DepositRow = ({ deposit }) => {
    const sweepStatusClass = deposit.sweep_status ? deposit.sweep_status.toLowerCase().replace('_', '-') : 'pending';
    return (
        <tr>
            <td>{new Date(deposit.created_at).toLocaleString()}</td>
            <td>{deposit.email}</td>
            <td>${parseFloat(deposit.amount).toFixed(2)}</td>
            <td className="wallet-address">
                <a href={`https://bscscan.com/tx/${deposit.deposit_hash}`} target="_blank" rel="noopener noreferrer" title={deposit.deposit_hash}>
                    {`${deposit.deposit_hash.substring(0, 10)}...`}
                </a>
            </td>
            <td>
                <span className={`status-badge ${sweepStatusClass}`}>
                    {deposit.sweep_status.replace('_', ' ')}
                </span>
            </td>
            <td className="wallet-address">
                {deposit.sweep_tx_hash ? (
                    <a href={`https://bscscan.com/tx/${deposit.sweep_tx_hash}`} target="_blank" rel="noopener noreferrer" title={deposit.sweep_tx_hash}>
                        {`${deposit.sweep_tx_hash.substring(0, 10)}...`}
                    </a>
                ) : 'N/A'}
            </td>
        </tr>
    );
};

function DepositTrackingPage() {
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchDeposits = useCallback(() => {
        setLoading(true);
        apiService.getAdminDepositTracking(debouncedSearchTerm)
            .then(response => setDeposits(response.data))
            .catch(() => setError('Failed to load deposit tracking data.'))
            .finally(() => setLoading(false));
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchDeposits();
    }, [fetchDeposits]);

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1>Deposit & Sweep Tracking</h1>
                <div className="header-actions">
                    <input
                        type="text"
                        placeholder="Search by User Email..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <p className="page-description">
                This page shows real-time blockchain deposits and their sweep status to the master wallet.
            </p>

            {error && <p className="error-message">{error}</p>}

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>User Email</th>
                            <th>Amount (USDT)</th>
                            <th>Deposit Hash (Blockchain)</th>
                            <th>Sweep Status</th>
                            <th>Sweep Hash (Blockchain)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                        ) : deposits.length > 0 ? (
                            deposits.map((deposit) => <DepositRow key={deposit.id} deposit={deposit} />)
                        ) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No deposits found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DepositTrackingPage;