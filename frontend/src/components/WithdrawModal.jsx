// frontend/src/components/WithdrawModal.jsx
import React, { useState } from 'react';

const WithdrawModal = ({ balance, onClose, onSubmit, isSubmitting }) => {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const ADMIN_WITHDRAWAL_FEE_PERCENT = 10;

    const numAmount = parseFloat(amount) || 0;
    const adminFee = (numAmount * ADMIN_WITHDRAWAL_FEE_PERCENT) / 100;
    const finalAmount = numAmount - adminFee;

    const handleSubmit = () => {
        if (isSubmitting) return;
        if (numAmount <= 0) { setError('Please enter a valid positive amount.'); return; }
        if (numAmount > balance) { setError('Withdrawal amount cannot exceed your available balance.'); return; }
        setError('');
        onSubmit(amount);
    };
    
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Request Withdrawal</h2>
                <p>Available Balance: ${parseFloat(balance).toFixed(2)}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-color-dark)', marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
                    A standard 10% service fee applies to all withdrawals.
                </p>
                <div className="form-group">
                    <label htmlFor="amount">Amount to Withdraw (USDT)</label>
                    <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`e.g., 10.00`} disabled={isSubmitting}/>
                </div>
                {numAmount > 0 && (
                    <div className="withdrawal-summary">
                        <div><span>Requested Amount:</span> <span>${numAmount.toFixed(2)}</span></div>
                        <div><span>Service Fee (10%):</span> <span>-${adminFee.toFixed(2)}</span></div>
                        <div className="final-amount"><span>You Will Receive:</span> <span>${finalAmount.toFixed(2)}</span></div>
                    </div>
                )}
                {error && <p className="error-message-modal">{error}</p>}
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
                    <button onClick={handleSubmit} className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</button>
                </div>
            </div>
        </div>
    );
};

export default WithdrawModal;