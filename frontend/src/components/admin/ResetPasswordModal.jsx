import React, { useState } from 'react';
import '../../pages/Modal.css';
import '../../pages/Form.css'; // पासवर्ड ग्रुप स्टाइल के लिए Form.css को इम्पोर्ट करें

const ResetPasswordModal = ({ onClose, onSubmit, userEmail }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- समाधान: पासवर्ड को दिखाने/छिपाने के लिए नया स्टेट ---
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        const success = await onSubmit(newPassword);
        if (!success) {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animated-fade-in" style={{maxWidth: '450px'}}>
                <div className="modal-header">
                    <h2>Reset Password</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <p>You are resetting the password for: <strong>{userEmail}</strong></p>
                    <p className="modal-warning">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        Please be careful. This action cannot be undone.
                    </p>
                    <form onSubmit={handleSubmit}>
                        {/* --- समाधान: पासवर्ड ग्रुप का उपयोग करें --- */}
                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="password-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        {/* --- समाधान: पासवर्ड ग्रुप का उपयोग करें --- */}
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <div className="password-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {error && <p className="error-message-form">{error}</p>}
                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordModal;