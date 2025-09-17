import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './Admin.css';

function AdminEarnings() {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    apiService.getAdminEarnings()
      .then(response => setEarnings(response.data))
      .catch(() => setError('Failed to load earnings report.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner">Loading Earnings Report...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-page-container">
      <h1>Admin Earnings Report (Upgrade Fees)</h1>
      <p>Showing the last 100 earnings from pool upgrades.</p>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>User Email</th>
              <th>Completed Pool</th>
              <th>Turnover</th>
              <th>Fee (10%)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {earnings.length > 0 ? (
                earnings.map(earn => (
                    <tr key={earn.id}>
                        <td>{earn.user_id}</td>
                        <td>{earn.email}</td>
                        <td>Pool {earn.pool_level}</td>
                        <td>${parseFloat(earn.turnover).toFixed(2)}</td>
                        <td><b>${parseFloat(earn.amount).toFixed(2)}</b></td>
                        <td>{new Date(earn.created_at).toLocaleString()}</td>
                    </tr>
                ))
            ) : (
              <tr><td colSpan="6">No earnings from upgrades found yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminEarnings;