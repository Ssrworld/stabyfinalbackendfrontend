import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import './Admin.css';
import CreditFundsModal from '../../components/admin/CreditFundsModal';
import DebitFundsModal from '../../components/admin/DebitFundsModal';
import ResetPasswordModal from '../../components/admin/ResetPasswordModal';
import ChangeSponsorModal from '../../components/admin/ChangeSponsorModal';

function UserDetailsPage() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [showDebitModal, setShowDebitModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [showSponsorModal, setShowSponsorModal] = useState(false);

    const fetchUserDetails = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiService.getAdminUserDetails(userId);
            setUser(response.data);
        } catch (error) {
            toast.error('Failed to fetch user details.');
            navigate('/admin/users');
        } finally {
            setLoading(false);
        }
    }, [userId, navigate]);

    useEffect(() => {
        fetchUserDetails();
    }, [userId, fetchUserDetails]);
    
    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await apiService.updateAdminUserDetails(userId, {
                email: user.email,
                mobile_number: user.mobile_number,
                status: user.status,
                is_suspended: user.is_suspended,
            });
            toast.success('User details updated successfully!');
            fetchUserDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user.');
        } finally {
            setIsUpdating(false);
        }
    };

    // ✅ नया फंक्शन यहाँ जोड़ा गया है
    const handleRoleChange = async (newRole) => {
        const action = newRole === 'PROMOTER' ? 'promote' : 'demote';
        if (!window.confirm(`Are you sure you want to ${action} this user to/from the Promoter role?`)) return;

        try {
            const response = await apiService.adminSetUserRole(userId, newRole);
            toast.success(response.data.message);
            fetchUserDetails(); // Refresh data to show new role
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role.');
        }
    };

    const handleCreditSubmit = async (data) => {
        try {
            await apiService.creditUserFunds({ ...data, userId });
            toast.success(`Funds credited successfully!`);
            setShowCreditModal(false);
            fetchUserDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to credit funds.`);
        }
    };

    const handleDebitSubmit = async (data) => {
        try {
            await apiService.debitUserFunds({ ...data, userId });
            toast.success(`Funds debited successfully!`);
            setShowDebitModal(false);
            fetchUserDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to debit funds.`);
        }
    };

    const handlePasswordReset = async (newPassword) => {
        try {
            const response = await apiService.adminResetUserPassword(userId, newPassword);
            toast.success(response.data.message);
            setShowResetPasswordModal(false);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password.');
            return false;
        }
    };

    const handleImpersonate = async () => {
        if (!window.confirm(`Are you sure you want to log in as ${user.email}?`)) return;
        try {
            const currentToken = localStorage.getItem('token');
            sessionStorage.setItem('admin_token', currentToken);
            const response = await apiService.generateImpersonationToken(userId);
            localStorage.setItem('token', response.data.token);
            window.location.href = '/dashboard';
        } catch (error) {
            toast.error('Failed to start impersonation session.');
        }
    };

    const handleSponsorChangeSubmit = async (newSponsorEmail) => {
        try {
            const response = await apiService.changeUserSponsor(userId, newSponsorEmail);
            toast.success(response.data.message);
            setShowSponsorModal(false);
            fetchUserDetails();
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change sponsor.');
            return false;
        }
    };

    if (loading) return <div className="admin-page-container">Loading user details...</div>;
    if (!user) return <div className="admin-page-container">User not found.</div>;

    return (
        <div className="admin-page-container">
            {showCreditModal && <CreditFundsModal user={user} onClose={() => setShowCreditModal(false)} onSubmit={handleCreditSubmit} />}
            {showDebitModal && <DebitFundsModal user={user} onClose={() => setShowDebitModal(false)} onSubmit={handleDebitSubmit} />}
            {showResetPasswordModal && <ResetPasswordModal onClose={() => setShowResetPasswordModal(false)} onSubmit={handlePasswordReset} userEmail={user.email} />}
            {showSponsorModal && <ChangeSponsorModal user={user} onClose={() => setShowSponsorModal(false)} onSubmit={handleSponsorChangeSubmit} />}
            
            <div className="page-header">
                <h1>User Details: {user.email} (ID: {user.id})</h1>
                <button onClick={() => navigate('/admin/users')} className="btn-secondary"><i className="fa-solid fa-arrow-left"></i> Back to Users</button>
            </div>

            <div className="two-column-grid">
                <div className="details-card main-details">
                    <form onSubmit={handleUpdate}>
                        <h3>Profile Information</h3>
                        {/* ✅ रोल दिखाने के लिए नया फील्ड */}
                        <div className="form-group">
                           <label>Role</label>
                           <input 
                               type="text" 
                               value={user.role || 'USER'} 
                               disabled 
                               style={{fontWeight: 'bold', color: user.role === 'PROMOTER' ? '#2ecc71' : 'inherit'}} 
                            />
                        </div>
                        <div className="form-group"><label>Email</label><input type="email" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} /></div>
                        <div className="form-group"><label>Mobile Number</label><input type="text" value={user.mobile_number || ''} onChange={(e) => setUser({ ...user, mobile_number: e.target.value })} /></div>
                        <div className="form-group"><label>Status</label><select value={user.status} onChange={(e) => setUser({ ...user, status: e.target.value })}><option value="PENDING">Pending</option><option value="ACTIVE">Active</option></select></div>
                        <div className="form-group-checkbox"><input type="checkbox" id="is_suspended" checked={!!user.is_suspended} onChange={(e) => setUser({ ...user, is_suspended: e.target.checked })} /><label htmlFor="is_suspended">Account Suspended</label></div>
                        <button type="submit" className="btn-primary" disabled={isUpdating}>{isUpdating ? 'Saving...' : 'Save Changes'}</button>
                    </form>
                </div>
                <div className="details-card">
                    <h3>Financials & Actions</h3>
                    <div className="financial-info">
                        <p><strong>Total Earnings:</strong> ${parseFloat(user.total_earnings || 0).toFixed(2)}</p>
                        <p><strong>Withdrawable Balance:</strong> ${parseFloat(user.withdrawable_balance || 0).toFixed(2)}</p>
                        <p><strong>Main Balance:</strong> ${parseFloat(user.main_balance || 0).toFixed(2)}</p>
                    </div>
                    <div className="admin-actions-grid">
                        <button onClick={() => setShowCreditModal(true)} className="btn-success"><i className="fa-solid fa-plus"></i> Credit</button>
                        <button onClick={() => setShowDebitModal(true)} className="btn-danger"><i className="fa-solid fa-minus"></i> Debit</button>
                        
                        {/* ✅ प्रमोटर बटन के लिए नया लॉजिक */}
                        {user.role === 'PROMOTER' ? (
                            <button onClick={() => handleRoleChange('USER')} className="btn-warning">
                                <i className="fa-solid fa-user-minus"></i> Remove Promoter
                            </button>
                        ) : (
                            <button onClick={() => handleRoleChange('PROMOTER')} className="btn-secondary" style={{backgroundColor: '#2ecc71', color: 'white', borderColor: '#27ae60'}}>
                                <i className="fa-solid fa-user-check"></i> Make Promoter
                            </button>
                        )}

                        <button onClick={() => setShowResetPasswordModal(true)} className="btn-warning"><i className="fa-solid fa-key"></i> Reset Password</button>
                        <button onClick={handleImpersonate} className="btn-secondary"><i className="fa-solid fa-mask"></i> Impersonate</button>
                        {user.referred_by === 1 && (
                            <button onClick={() => setShowSponsorModal(true)} className="btn-secondary" style={{gridColumn: '1 / -1'}}>
                                <i className="fa-solid fa-user-pen"></i> Change Sponsor
                            </button>
                        )}
                    </div>
                    <h3 style={{marginTop: '2rem'}}>Matrix Snapshot</h3>
                    <div className="matrix-snapshot">
                        <div className="snapshot-item">
                            <span className="snapshot-label">Sponsor (Upline)</span>
                            <span className="snapshot-value">{user.sponsor_email || 'N/A (Admin)'}</span>
                        </div>
                        <div className="snapshot-item">
                            <span className="snapshot-label">Direct Referrals</span>
                            <span className="snapshot-value">{user.direct_referrals_count}</span>
                        </div>
                        <div className="snapshot-item">
                            <span className="snapshot-label">Total Downline</span>
                            <span className="snapshot-value">{user.downline_count}</span>
                        </div>
                        <Link to={`/admin/team-tree/${userId}`} className="btn-primary" style={{gridColumn: '1 / -1', marginTop: '1rem'}}>
                            <i className="fa-solid fa-sitemap"></i> View Full Tree
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserDetailsPage;