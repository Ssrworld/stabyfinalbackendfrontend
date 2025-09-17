// frontend/src/components/dashboard/DirectReferrals.jsx

import React from 'react';
import EmptyState from '../EmptyState';

const DirectReferrals = ({ referrals, isLoading }) => {
    return (
        <div className="info-card full-width inside-accordion">
            {isLoading ? (
                <p className="loading-text">Loading referrals...</p>
            ) : !Array.isArray(referrals) || referrals.length === 0 ? (
                <EmptyState message="You haven't referred anyone yet. Share your link to build your team!" icon="fa-user-plus" />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Email</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referrals.map((ref) => (
                                <tr key={ref.id}>
                                    <td>{ref.id}</td>
                                    <td>{ref.email}</td>
                                    <td><span className={`status-badge ${ref.status.toLowerCase().replace('_', '-')}`}>{ref.status.replace('_', ' ')}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DirectReferrals;
