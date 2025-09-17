// frontend/src/components/admin/DebitFundsModal.jsx
import React, { useState } from 'react';
import '../../pages/Modal.css';

const DebitFundsModal = ({ user, onClose, onSubmit, isSubmitting }) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (isSubmitting) return;
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            setError('Please enter a valid positive amount.');
            return;
        }
        if (numAmount > parseFloat(user.main_balance)) {
            setError('Debit amount cannot exceed user\'s main balance.');
            return;
        }
        if (!reason) {
            setError('A reason for the debit is required.');
            return;
        }
        setError('');
        onSubmit({ userId: user.id, amount, reason });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Debit Funds from User</h2>
                <p>You are debiting funds from: <strong>{user.email} (ID: {user.id})</strong></p>
                <p>Current Main Balance: <strong>${parseFloat(user.main_balance).toFixed(2)}</strong></p>

                <div className="form-group">
                    <label htmlFor="amount">Amount to Debit (USDT)</label>
                    <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isSubmitting} placeholder="e.g., 25.00" />
                </div>
                <div className="form-group">
                    <label htmlFor="reason">Reason (Required)</label>
                    <input type="text" id="reason" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isSubmitting} placeholder="e.g., Reversal of incorrect credit" />
                </div>

                {error && <p className="error-message-modal">{error}</p>}
                
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
                    <button onClick={handleSubmit} className="btn-primary" disabled={isSubmitting} style={{backgroundColor: '#f44336', borderColor: '#d32f2f'}}>
                        {isSubmitting ? 'Debiting...' : 'Confirm Debit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DebitFundsModal;