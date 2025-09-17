// frontend/src/pages/admin/PromoterPayoutsPage.jsx (CLEANED UP VERSION)

import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './Admin.css';

function PromoterPayoutsPage() {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiService.getAdminPromoterPayouts()
            .then(res => {
                if (Array.isArray(res.data)) {
                    setPayouts(res.data);
                } else {
                    console.error("API did not return an array for promoter payouts:", res.data);
                    setPayouts([]); 
                }
            })
            .catch((err) => {
                console.error("Failed to load promoter payout history.", err);
                alert('Failed to load promoter payout history.');
            })
            .finally(() => setLoading(false));
    }, []);

    const formatCommissionType = (type) => {
        if (!type) return 'N/A';
        let formatted = type.replace('PROMOTER_', '').replace(/_/g, ' ');
        return formatted.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
    };

    return (
        <div className="admin-page-container">
            <h1>Promoter Payout History</h1>
            <p className="page-description">This log shows all extra commissions paid to users with the 'Promoter' role.</p>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Promoter</th>
                            <th>From User (Activation)</th>
                            <th>Amount Paid</th>
                            <th>Commission Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading history...</td></tr>
                        ) 
                        : Array.isArray(payouts) && payouts.length > 0 ? (
                            payouts.map(payout => (
                                <tr key={payout.id}>
                                    <td>{new Date(payout.created_at).toLocaleString()}</td>
                                    <td>{payout.promoter_email}</td>
                                    <td>{payout.from_user_email}</td>
                                    <td><b>${Math.abs(parseFloat(payout.amount)).toFixed(2)}</b></td>
                                    <td>
                                        {/* ✅ No inline style needed anymore */}
                                        <span className="status-badge active">
                                            {formatCommissionType(payout.type)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No promoter payouts have been made yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PromoterPayoutsPage;