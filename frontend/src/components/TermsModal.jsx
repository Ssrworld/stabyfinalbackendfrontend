// frontend/src/components/TermsModal.jsx

import React from 'react';
import '../pages/Modal.css'; // हम मौजूदा Modal CSS का पुन: उपयोग करेंगे

const TermsModal = ({ onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content terms-modal-content" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-color-dark)', cursor: 'pointer' }}
                >
                    &times;
                </button>
                
                <h3 style={{ marginTop: 0, color: 'var(--text-color)' }}>Stabylink Rewards Program - Terms and Conditions</h3>
                <p><strong>Please read carefully. By participating in this Program, you agree to these binding terms.</strong></p>
                
                <h4>1. Nature of the Program & Acceptance of Terms</h4>
                <p>1.1. <strong>No Investment Contract:</strong> You acknowledge that the Stabylink Rewards Program ("the Program") is not an investment or a security. It is a performance-based rewards program.</p>
                <p>1.2. <strong>Contribution, Not Investment:</strong> A one-time contribution of <strong>$20 USDT (BEP-20)</strong> is required for entry. This contribution is a fee, not an investment, and is <strong>strictly non-refundable</strong>.</p>
                <p>1.3. <strong>Assumption of Risk:</strong> You understand and accept that there is no guarantee of earnings. Your success depends entirely on your personal efforts & community Growth . You assume all risks associated with your participation.</p>

                <h4>2. Earnings and Payout Conditions</h4>
                <p>2.1. <strong>Restriction on Pool Rewards:</strong> The ability to withdraw pool-based rewards is contingent upon having a minimum of <strong>3 active direct referrals</strong>. This condition applies only to pool-based earnings.</p>
                <p>2.2. <strong>Service Fee:</strong> A flat <strong>10% service fee</strong> will be applied to all withdrawals and to all P2P transfers made from the Withdrawable Balance.</p>
                <p>2.3. <strong>Payouts:</strong> All payouts are processed exclusively in <strong>USDT (BEP-20)</strong>. Providing a correct wallet address is your sole responsibility. Blockchain transactions are irreversible.</p>

                <h4>3. User Obligations</h4>
                <p>3.1. <strong>Ethical Promotion:</strong> You shall not engage in any false or misleading income claims. Do not use terms like "guaranteed returns."</p>
                <p>3.2. <strong>Account Security:</strong> You are solely responsible for the security of your account credentials.</p>

                <h4>4. Account Termination</h4>
                <p>Stabylink reserves the right to suspend or terminate any account that breaches these terms or engages in fraudulent activities. In such an event, all funds remaining in the account will be forfeited.</p>
            </div>
        </div>
    );
};

export default TermsModal;