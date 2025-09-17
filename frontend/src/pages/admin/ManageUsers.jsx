// frontend/src/pages/admin/ManageUsers.jsx (A-to-Z CODE WITH PROMOTER BADGE LOGIC)

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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

const FILTER_OPTIONS = ['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'];

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isExporting, setIsExporting] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = useCallback((page, search, filter) => {
    setLoading(true);
    apiService.getAdminAllUsers(page, search, filter)
      .then(response => {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      })
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);
  
  useEffect(() => { 
    fetchUsers(currentPage, debouncedSearchTerm, activeFilter); 
  }, [currentPage, debouncedSearchTerm, activeFilter, fetchUsers]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, activeFilter]);


  const handleExport = async () => {
    setIsExporting(true);
    try {
        const response = await apiService.exportAdminUsers(debouncedSearchTerm);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'stabylink_users_export.csv');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Export failed:", err);
        setError("Could not export data. Please try again.");
    } finally {
        setIsExporting(false);
    }
  };
  
  const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString();
  };
  
  const handleNextPage = () => {
      if (pagination && currentPage < pagination.totalPages) {
          setCurrentPage(currentPage + 1);
      }
  };

  const handlePrevPage = () => {
      if (currentPage > 1) {
          setCurrentPage(currentPage - 1);
      }
  };
  
  const renderTableBody = () => {
    if (loading) return <tr><td colSpan="13" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>;
    if (users.length === 0) return <tr><td colSpan="13" style={{ textAlign: 'center', padding: '2rem' }}>No users found for the selected filter.</td></tr>;
    
    return users.map(user => (
      <tr key={user.id} className={user.is_suspended ? 'suspended-row' : ''}>
        <td>{user.global_placement_id || '-'}</td>
        <td>{user.id}</td>
        <td>
            {/* ✅✅✅ START: प्रमोटर बैज के लिए लॉजिक यहाँ जोड़ा गया है ✅✅✅ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to={`/admin/users/${user.id}`} className="user-email-link">{user.email}</Link>
                {user.role === 'PROMOTER' && (
                    <span className="promoter-badge-table" title="Promoter">
                        <i className="fa-solid fa-crown"></i>
                    </span>
                )}
            </div>
            {/* ✅✅✅ END: लॉजिक ✅✅✅ */}
        </td>
        <td>
          <span className={`status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
          {!!user.is_suspended && <span className="status-badge suspended">Suspended</span>}
        </td>
        <td>{user.current_pool}</td>
        <td>{user.direct_referrals_count}</td>
        <td>{user.downline_count} / 3</td>
        <td>{user.referrer_email || 'N/A'}</td>
        <td>${parseFloat(user.total_earnings || 0).toFixed(2)}</td>
        <td>${parseFloat(user.withdrawable_balance || 0).toFixed(2)}</td>
        <td>${parseFloat(user.main_balance || 0).toFixed(2)}</td>
        <td>{formatDate(user.registration_timestamp)}</td>
        <td>{formatDate(user.activation_timestamp)}</td>
      </tr>
    ));
  };

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1>Manage Users</h1>
        <div className="header-actions">
            <input type="text" placeholder="Search by Email or ID..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button 
                onClick={handleExport} 
                className="btn-export" 
                disabled={loading || users.length === 0 || isExporting}
            >
                <i className="fa-solid fa-file-csv"></i> 
                {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
        </div>
      </div>
      
      <div className="filter-bar">
        {FILTER_OPTIONS.map(option => (
          <button
            key={option}
            className={`filter-btn ${activeFilter === option ? 'active' : ''}`}
            onClick={() => setActiveFilter(option)}
          >
            {option.replace('_', ' ')}
          </button>
        ))}
      </div>
      
      {error && <p className="error-message">{error}</p>}

      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Placement ID</th>
              <th>User ID</th>
              <th>Email</th>
              <th>Status</th>
              <th>Pool</th>
              <th>Direct Refs</th>
              <th>Downline</th>
              <th>Referred By</th>
              <th>Total Earned</th>
              <th>Withdrawable</th>
              <th>Main Wallet</th>
              <th>Registered On</th>
              <th>Activated On</th>
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>
      
      {pagination && pagination.total > 0 && (
          <div className="pagination">
              <button onClick={handlePrevPage} disabled={currentPage === 1 || loading}>
                  &laquo; Previous
              </button>
              <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
              </span>
              <button onClick={handleNextPage} disabled={currentPage === pagination.totalPages || loading}>
                  Next &raquo;
              </button>
          </div>
      )}
    </div>
  );
}

export default ManageUsers;