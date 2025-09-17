// frontend/src/components/UpdateWalletModal.jsx
import React, { useState } from 'react';

const UpdateWalletModal = ({ currentWallet, onClose, onSubmit, isSubmitting }) => {
    const [walletAddress, setWalletAddress] = useState(currentWallet || '');
    const [error, setError] = useState('');
    
    const handleSubmit = () => {
        if (isSubmitting) return;
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) { setError('Please enter a valid BEP-20 wallet address.'); return; }
        setError('');
        onSubmit(walletAddress);
    };
    
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Update Payout Wallet</h2>
                <p>This is the BEP-20 address where you will receive your withdrawals.</p>
                <div className="form-group">
                    <label htmlFor="walletAddress">Your BEP-20 Wallet Address</label>
                    <input type="text" id="walletAddress" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." disabled={isSubmitting}/>
                </div>
                {error && <p className="error-message-modal">{error}</p>}
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
                    <button onClick={handleSubmit} className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Wallet'}</button>
                </div>
            </div>
        </div>
    );
};

export default UpdateWalletModal;