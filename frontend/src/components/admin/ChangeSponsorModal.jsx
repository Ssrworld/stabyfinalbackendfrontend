// frontend/src/components/admin/ChangeSponsorModal.jsx

import React, { useState } from 'react';
import '../../pages/Modal.css'; // Modal की स्टाइल का पुन: उपयोग करें

const ChangeSponsorModal = ({ user, onClose, onSubmit }) => {
    const [newSponsorEmail, setNewSponsorEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!newSponsorEmail) {
            setError('Please enter the new sponsor\'s email.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        // onSubmit फंक्शन एक वादा लौटाएगा, जो API कॉल के सफल होने या न होने पर निर्भर करेगा
        const success = await onSubmit(newSponsorEmail);
        // अगर सबमिशन सफल नहीं होता है तो लोडिंग स्टेट को false पर सेट करें
        if (!success) {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Change Sponsor for {user.email}</h2>
                <p>
                    Current Sponsor: <strong>System Admin (ID: 1)</strong>
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-color-dark)'}}>
                    This will reassign the user to a new sponsor and transfer the $5.00 referral commission.
                </p>
                <div className="form-group">
                    <label htmlFor="newSponsorEmail">New Sponsor's Email</label>
                    <input
                        type="email"
                        id="newSponsorEmail"
                        value={newSponsorEmail}
                        onChange={(e) => setNewSponsorEmail(e.target.value)}
                        placeholder="Enter the correct sponsor's email"
                        disabled={isSubmitting}
                    />
                </div>
                {error && <p className="error-message-modal">{error}</p>}
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
                    <button onClick={handleSubmit} className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Confirm Change'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangeSponsorModal;