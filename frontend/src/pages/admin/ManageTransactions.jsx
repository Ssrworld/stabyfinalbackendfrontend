// frontend/src/pages/admin/ManageTransactions.jsx

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/api';
import './Admin.css';

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

const TransactionRow = ({ tx }) => {
    const txTypeClass = tx.type.toLowerCase();
    const statusClass = tx.status ? tx.status.toLowerCase().replace('_', '-') : '';

    return (
        <tr>
            <td>
                <span className={`tx-type-badge ${txTypeClass}`}>{tx.type}</span>
            </td>
            <td>{tx.email}</td>
            <td>${parseFloat(tx.amount).toFixed(2)}</td>
            <td>
                <span className={`status-badge ${statusClass}`}>
                    {tx.status ? tx.status.replace('_', ' ') : 'N/A'}
                </span>
            </td>
            <td className="wallet-address">
                {tx.tx_hash ? (
                    <a href={`https://bscscan.com/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer" title={tx.tx_hash}>
                        {`${tx.tx_hash.substring(0, 8)}...${tx.tx_hash.substring(tx.tx_hash.length - 6)}`}
                    </a>
                ) : 'N/A'}
            </td>
            <td>{tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A'}</td>
        </tr>
    );
};

function ManageTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    // -- API कॉल में फ़िल्टर पैरामीटर भेजें --
    apiService.getAdminAllTransactions(filterType, debouncedSearchTerm)
      .then(response => setTransactions(response.data))
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setLoading(false));
  }, [filterType, debouncedSearchTerm]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="admin-page-container">
      <div className="page-header">
          <h1>All Transactions</h1>
          <div className="header-actions">
              <select 
                  className="search-input"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
              >
                  <option value="all">All Types</option>
                  <option value="deposit">Deposits Only</option>
                  <option value="withdrawal">Withdrawals Only</option>
              </select>
              <input 
                  type="text"
                  placeholder="Search by User Email..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
      </div>
      <p>Showing the last 100 results for the selected filters.</p>
      
      {error && <p className="error-message">{error}</p>}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>User Email</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Transaction Hash</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Loading...</td></tr>
            ) : transactions.length > 0 ? (
                transactions.map((tx, index) => <TransactionRow key={index} tx={tx} />)
            ) : (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageTransactions;