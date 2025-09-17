// frontend/src/components/TransferFundsModal.jsx (FINAL, USER-FRIENDLY, AND CORRECTED DISPLAY)

import React, { useState } from 'react';
import '../pages/Modal.css';

const TransferFundsModal = ({ mainBalance, withdrawableP2PLimit, onClose, onSubmit, isSubmitting }) => {
    const [sourceWallet, setSourceWallet] = useState('main');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [amount, setAmount] = useState(''); // This will be the TOTAL amount to deduct
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const P2P_FEE_PERCENT = 10;
    const totalDeducted = parseFloat(amount) || 0;
    const fee = sourceWallet === 'withdrawable' ? (totalDeducted * P2P_FEE_PERCENT) / 100 : 0;
    const amountReceived = totalDeducted - fee;

    const availableMainBalance = parseFloat(mainBalance) || 0;
    const availableP2PLimit = parseFloat(withdrawableP2PLimit) || 0;

    const handleSubmit = () => {
        if (isSubmitting) return;
        
        const balanceToCheck = sourceWallet === 'main' ? availableMainBalance : availableP2PLimit;

        if (!recipientEmail || !amount || !password) {
            setError('All fields are required.'); return;
        }
        if (totalDeducted <= 0) {
            setError('Please enter a valid amount.'); return;
        }
        if (totalDeducted > balanceToCheck) {
            setError(`Amount exceeds your available transfer limit of $${balanceToCheck.toFixed(2)}.`); return;
        }
        setError('');
        onSubmit({ recipientEmail, amount, password, sourceWallet });
    };

    const isWithdrawableDisabled = availableP2PLimit <= 0;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Transfer Funds</h2>
                
                <div className="form-group">
                    <label>Transfer From:</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="radio" value="main" checked={sourceWallet === 'main'} onChange={(e) => setSourceWallet(e.target.value)} />
                            Main Wallet (${availableMainBalance.toFixed(2)})
                        </label>
                        {/* ✅✅✅ THIS IS THE CORRECTED LINE ✅✅✅ */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isWithdrawableDisabled ? 'not-allowed' : 'pointer', opacity: isWithdrawableDisabled ? 0.5 : 1 }}>
                            <input type="radio" value="withdrawable" checked={sourceWallet === 'withdrawable'} onChange={(e) => setSourceWallet(e.target.value)} disabled={isWithdrawableDisabled} />
                            Withdrawable (${availableP2PLimit.toFixed(2)})
                        </label>
                    </div>
                </div>

                <div className="form-group"><label htmlFor="recipientEmail">Recipient's Email</label><input type="email" id="recipientEmail" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} disabled={isSubmitting} /></div>
                <div className="form-group"><label htmlFor="amount">Amount to Transfer (USDT)</label><input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isSubmitting} /></div>
                <div className="form-group"><label htmlFor="password">Your Current Password (for security)</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} /></div>

                {sourceWallet === 'withdrawable' && totalDeducted > 0 && (
                    <div className="withdrawal-summary">
                        <div><span>Total Amount to Transfer:</span> <span>${totalDeducted.toFixed(2)}</span></div>
                        <div><span>Service Fee ({P2P_FEE_PERCENT}%):</span> <span>-${fee.toFixed(2)}</span></div>
                        <div className="final-amount"><span>Recipient Will Receive:</span> <span>${amountReceived.toFixed(2)}</span></div>
                    </div>
                )}
                
                {error && <p className="error-message-modal">{error}</p>}

                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
                    <button onClick={handleSubmit} className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransferFundsModal;
