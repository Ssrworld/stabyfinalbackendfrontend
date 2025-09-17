import React, { useState } from 'react';
import '../pages/Modal.css'; // हम मौजूदा Modal CSS का पुन: उपयोग करेंगे

const ClaimRewardModal = ({ onClose, onSubmit, isSubmitting }) => {
    const [walletAddress, setWalletAddress] = useState('');
    const [error, setError] = useState('');
    
    const handleSubmit = () => {
        if (isSubmitting) return;
        // BEP-20 एड्रेस के लिए सरल Regex जाँच
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            setError('Please enter a valid BEP-20 wallet address.');
            return;
        }
        setError('');
        onSubmit(walletAddress);
    };
    
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Claim Your STBL Token Reward</h2>
                <p>
                    Enter your BEP-20 compatible wallet address below. Your 10,000 STBL tokens will be sent here.
                    <br/>
                    <strong>Please double-check the address, as transactions are irreversible.</strong>
                </p>
                <div className="form-group">
                    <label htmlFor="walletAddress">Your BEP-20 Wallet Address for STBL Tokens</label>
                    <input
                        type="text"
                        id="walletAddress"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="0x..."
                        disabled={isSubmitting}
                    />
                </div>
                {error && <p className="error-message-modal">{error}</p>}
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
                    <button onClick={handleSubmit} className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit & Claim'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClaimRewardModal;