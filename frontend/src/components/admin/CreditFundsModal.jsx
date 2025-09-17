// frontend/src/components/admin/CreditFundsModal.jsx (FIXED)

import React, { useState } from 'react';
import '../../pages/Modal.css';

// --- ✅ समाधान: props में isSubmitting जोड़ें और user को डीस्ट्रक्चर करें ---
const CreditFundsModal = ({ user, onClose, onSubmit }) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // --- ✅ समाधान: अपना खुद का सबमिटिंग स्टेट रखें ---

    const handleSubmit = async () => {
        if (isSubmitting) return;
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            setError('Please enter a valid positive amount.');
            return;
        }
        if (!reason) {
            setError('A reason for the credit is required.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        // onSubmit को कॉल करें और इसे सबमिटिंग स्टेट को हैंडल करने दें
        await onSubmit({ amount, reason });
        setIsSubmitting(false); // पैरेंट में त्रुटि होने पर इसे रीसेट करें
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Credit Funds to User</h2>
                {/* --- ✅ समाधान: user ऑब्जेक्ट से ईमेल और आईडी का उपयोग करें --- */}
                <p>You are crediting funds to: <strong>{user?.email} (ID: {user?.id})</strong></p>
                <div className="form-group">
                    <label htmlFor="amount">Amount (USDT)</label>
                    <input 
                        type="number" 
                        id="amount" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        disabled={isSubmitting} 
                        placeholder="e.g., 50.00" 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="reason">Reason (Required)</label>
                    <input 
                        type="text" 
                        id="reason" 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        disabled={isSubmitting} 
                        placeholder="e.g., Manual top-up, Bonus, etc." 
                    />
                </div>
                {error && <p className="error-message-modal">{error}</p>}
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
                    <button onClick={handleSubmit} className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Crediting...' : 'Confirm Credit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreditFundsModal;