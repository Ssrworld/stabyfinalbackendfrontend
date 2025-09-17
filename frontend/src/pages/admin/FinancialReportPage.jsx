// frontend/src/pages/admin/FinancialReportPage.jsx (MODIFIED)

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import './Admin.css';

// --- ✅ समाधान: इस फंक्शन को और अधिक वर्णनात्मक बनाया गया है ---
// (यह फंक्शन बैकएंड लॉजिक को समझने में मदद करता है, इसे हटाने की जरूरत नहीं है)
const getTransactionDetails = (tx) => {
  // Amount > 0 सिस्टम के लिए आय है।
  // Amount < 0 सिस्टम के लिए खर्च है।
  switch (tx.type) {
    case 'JOINING_FEE':
      return `Admin's share of joining fee from ${tx.user_email}.`;
    case 'WITHDRAWAL_FEE':
      return `Fee collected from ${tx.user_email}'s withdrawal.`;
    case 'DIRECT_REFERRAL':
      if (tx.amount > 0) { // यह तब होता है जब एडमिन (ID 1) प्रायोजक होता है
        return `Commission received by Admin for referral of ${tx.user_email}.`;
      } else { // यह एक खर्च है
        return `Commission paid to sponsor ${tx.sponsor_email || 'N/A'} for referral of ${tx.user_email}.`;
      }
    case 'POOL_PAYOUT':
      return `Pool completion payout to ${tx.user_email}.`;
    default:
      return 'General system transaction.';
  }
};

const TRANSACTION_TYPES = ['ALL', 'JOINING_FEE', 'DIRECT_REFERRAL', 'POOL_PAYOUT', 'WITHDRAWAL_FEE'];

function FinancialReportPage() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const transactionsResponse = await apiService.getFinancialTransactions();
        setAllTransactions(transactionsResponse.data);
      } catch (error) {
        toast.error('Failed to load financial transactions.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'ALL') {
      return allTransactions;
    }
    return allTransactions.filter(tx => tx.type === activeFilter);
  }, [allTransactions, activeFilter]);

  if (loading) return <div className="admin-page-container">Loading financial transactions...</div>;

  return (
    <div className="admin-page-container">
      {/* --- ✅ समाधान: हेडिंग को "Financial Transactions" में बदल दिया गया है --- */}
      <h1>Financial Transactions</h1>
      <p className="page-description">
        This page provides an overview of all income and expense transactions recorded in the system.
      </p>
      
      {/* --- ❌ हटाए गए हिस्से --- */}
      {/* ReportCard और Note Box को यहाँ से हटा दिया गया है। */}
      
      <div className="filter-bar">
        {TRANSACTION_TYPES.map(type => (
          <button
            key={type}
            className={`filter-btn ${activeFilter === type ? 'active' : ''}`}
            onClick={() => setActiveFilter(type)}
          >
            {type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>User</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(tx => {
                const isIncome = tx.amount > 0;
                return (
                  <tr key={tx.id}>
                    <td>{new Date(tx.created_at).toLocaleString()}</td>
                    <td><span className="transaction-type-badge">{tx.type.replace('_', ' ')}</span></td>
                    <td>
                      <span style={{color: isIncome ? '#4caf50' : '#f44336', fontWeight: 'bold'}}>
                        {isIncome ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </td>
                    <td>{tx.user_email}</td>
                    <td>{getTransactionDetails(tx)}</td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No transactions found for the selected filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FinancialReportPage;
