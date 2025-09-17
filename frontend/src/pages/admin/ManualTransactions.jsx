// frontend/src/pages/admin/ManualTransactions.jsx

import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './Admin.css';

function ManualTransactions() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    apiService.getAdminManualTransactions()
      .then(response => setHistory(response.data))
      .catch(() => setError('Failed to load manual transaction history.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner">Loading History...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-page-container">
      <h1>Manual Transaction History</h1>
      <p>Showing the last 100 manual credits/debits performed by admins.</p>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Admin</th>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
                history.map((tx) => (
                    <tr key={tx.id}>
                        <td>{new Date(tx.created_at).toLocaleString()}</td>
                        <td>{tx.admin_email}</td>
                        <td>{tx.user_email}</td>
                        <td>
                            <span className={`tx-type-badge ${tx.type.toLowerCase() === 'credit' ? 'deposit' : 'withdrawal'}`}>
                                {tx.type}
                            </span>
                        </td>
                        <td><b>${parseFloat(tx.amount).toFixed(2)}</b></td>
                        <td>{tx.reason || 'N/A'}</td>
                    </tr>
                ))
            ) : (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No manual transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManualTransactions;