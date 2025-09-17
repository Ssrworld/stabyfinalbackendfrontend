// frontend/pages/DashboardPage.jsx (Updated to display promoter sections)

import React from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useDashboard } from '../hooks/useDashboard';

// Components
import InfoCard from '../components/InfoCard';
import Accordion from '../components/Accordion';
import RewardRoadmap from '../components/RewardRoadmap';
import DashboardSkeleton from '../components/DashboardSkeleton';
import PromoterStats from '../components/dashboard/PromoterStats';
import PromoterCommissionHistory from '../components/dashboard/PromoterCommissionHistory';

// Modals
import WithdrawModal from '../components/WithdrawModal';
import UpdateWalletModal from '../components/UpdateWalletModal';
import TransferFundsModal from '../components/TransferFundsModal';
import ClaimRewardModal from '../components/ClaimRewardModal';

// History Components
import DepositHistory from '../components/dashboard/DepositHistory';
import WithdrawalHistory from '../components/dashboard/WithdrawalHistory';
import DirectReferrals from '../components/dashboard/DirectReferrals';
import CommissionHistory from '../components/dashboard/CommissionHistory';
import FundTransferHistory from '../components/dashboard/FundTransferHistory';
import AnnouncementBar from '../components/dashboard/AnnouncementBar';

import './DashboardPage.css';
import './Modal.css';
import '../components/dashboard/Promoter.css'; // प्रमोटर CSS को इम्पोर्ट करें

const StblRewardCard = ({ userData, onClaimClick, handleCopy, copied }) => {
    const activeReferrals = userData.activeDirectReferrals || 0;
    const progress = Math.min((activeReferrals / 5) * 100, 100);
    const STBL_CONTRACT_ADDRESS = "0x5e924a856fDe82dE185dFd762c6Dd9BD92c19889";
    const TOKEN_SYMBOL = "STBL";
    const TOKEN_NETWORK = "BSC (Binance Smart Chain)";
    const TOKEN_DECIMALS = 18;

    if (activeReferrals < 5 && !userData.stblRewardStatus) {
        return (
            <InfoCard title="STBL Token Bonus" icon="fa-gift" fullWidth>
                <h4>Unlock 10,000 STBL Tokens!</h4>
                <p className="info-card-description">Activate 5 direct referrals to claim your massive token bonus.</p>
                <div className="reward-progress-bar"><div className="reward-progress-fill" style={{ width: `${progress}%` }}></div></div>
                <p className="reward-progress-text">Your Progress: <strong>{activeReferrals} / 5</strong> Active Referrals</p>
            </InfoCard>
        );
    }

    if (userData.stblRewardStatus === 'UNCLAIMED') {
         return (
            <InfoCard title="STBL Token Bonus" icon="fa-gift" fullWidth>
                <p className="stbl-balance-value"><span>STBL</span> {parseFloat(userData.stbl_token_balance || 0).toLocaleString()}</p>
                <p className="info-card-description" style={{textAlign: 'center'}}>Congratulations! You've unlocked your token bonus. Add your wallet address to claim it.</p>
                <div className="contract-address-container">{STBL_CONTRACT_ADDRESS}</div>
                <div className="card-actions" style={{justifyContent: 'center', marginTop: '1rem'}}>
                    <button onClick={onClaimClick} className="btn-primary"><i className="fa-solid fa-wallet"></i> Add Wallet & Claim</button>
                </div>
            </InfoCard>
        );
    }

    return (
        <InfoCard title="STBL Token Bonus" icon="fa-gift" fullWidth>
            <p className="stbl-balance-value"><span>STBL</span> {parseFloat(userData.stbl_token_balance || 0).toLocaleString()}</p>
            {userData.stblRewardStatus === 'PENDING_TRANSFER' && (<div style={{textAlign: 'center', marginTop: '1rem'}}><div className="contract-address-container">Token Contract: {STBL_CONTRACT_ADDRESS}</div><p className="claim-status pending">Claim processed. Transfer is scheduled...</p></div>)}
            {userData.stblRewardStatus === 'TRANSFERRED' && (<div className="token-import-details"><h4>Tokens Transferred</h4><p>To see your tokens, import them into your Web3 wallet (e.g., stabylink ,MetaMask, Trust Wallet) using the details below.</p><div className="token-info-grid"><strong>Network:</strong><span>{TOKEN_NETWORK}</span><strong>Symbol:</strong><span>{TOKEN_SYMBOL}</span><strong>Decimals:</strong><span>{TOKEN_DECIMALS}</span><strong className="align-top">Contract:</strong><div className="token-contract-row"><span>{STBL_CONTRACT_ADDRESS}</span><button onClick={() => handleCopy(STBL_CONTRACT_ADDRESS, 'contract')} className="copy-icon-btn minimal"><i className={`fa-solid ${copied.contract ? 'fa-check' : 'fa-copy'}`}></i></button></div></div></div>)}
            {userData.stblRewardStatus === 'FAILED' && (<div style={{textAlign: 'center', marginTop: '1rem'}}><div className="contract-address-container">Token Contract: {STBL_CONTRACT_ADDRESS}</div><p className="claim-status failed">Transfer Failed. Please contact support.</p></div>)}
        </InfoCard>
    );
};

function DashboardPage() {
    const {
        userData, statsData, announcements, loading, error, copied, promoterData, milestonesConfig,
        showWithdrawModal, setShowWithdrawModal, showUpdateWalletModal, setShowUpdateWalletModal,
        showTransferModal, setShowTransferModal, showClaimRewardModal, setShowClaimRewardModal,
        isSubmitting, isActivating, isTransferring, isClaiming,
        handleCopy, handleWithdrawSubmit, handleUpdateWalletSubmit, handleActivate, 
        handleTransferSubmit, handleClaimRewardSubmit
    } = useDashboard();

    if (loading || !userData.id) return <DashboardSkeleton />;
    if (error) return <div className="error-message">{error}</div>;

    const isPromoter = userData.role === 'PROMOTER';
    const totalReferralEarnings = parseFloat(userData.totalReferralEarnings || 0);
    const rewardProgramEarnings = parseFloat(userData.rewardProgramEarnings || 0);
    const totalEarnings = parseFloat(userData.total_earnings || 0);
    const totalWithdrawable = parseFloat(userData.withdrawable_balance || 0);
    const mainWalletBalance = parseFloat(userData.main_balance || 0);
    const isPending = userData.status === 'PENDING' || userData.status === 'INSUFFICIENT_DEPOSIT';
    const referralLink = userData.referral_code ? `${window.location.origin}/register/${userData.referral_code}` : '';
    const directReferralsCount = (userData.directReferrals && Array.isArray(userData.directReferrals)) ? userData.directReferrals.length : 0;
    const depositedBalance = userData.depositedBalance || 0;
    const activationAmount = 20.0;
    const isActivationPossible = mainWalletBalance >= activationAmount || depositedBalance >= activationAmount;
    const activeReferrals = userData.activeDirectReferrals || 0;
    const canWithdrawPool = activeReferrals >= 3;
    
    return (
        <div className="dashboard-container">
            <div className="dashboard-overlay">
                <AnnouncementBar announcements={announcements} />
                <p className="welcome-message">
                    Welcome, {userData.email}
                    {isPromoter && <span className="promoter-badge">PROMOTER</span>}
                </p>

                {showWithdrawModal && <WithdrawModal balance={totalWithdrawable} onClose={() => setShowWithdrawModal(false)} onSubmit={handleWithdrawSubmit} isSubmitting={isSubmitting} />}
                {showUpdateWalletModal && <UpdateWalletModal currentWallet={userData.payout_wallet} onClose={() => setShowUpdateWalletModal(false)} onSubmit={handleUpdateWalletSubmit} isSubmitting={isSubmitting}/>}
                {showTransferModal && <TransferFundsModal mainBalance={mainWalletBalance} withdrawableP2PLimit={userData.withdrawable_p2p_limit} onClose={() => setShowTransferModal(false)} onSubmit={handleTransferSubmit} isSubmitting={isTransferring} />}
                {showClaimRewardModal && <ClaimRewardModal onClose={() => setShowClaimRewardModal(false)} onSubmit={handleClaimRewardSubmit} isSubmitting={isClaiming} />}
                
                {isPromoter && promoterData && (
                    <PromoterStats 
                        promoterData={promoterData} 
                        directReferralsCount={activeReferrals}
                        milestonesConfig={milestonesConfig}
                    />
                )}

                {isPending && (
                    <div className="activation-grid" style={{ marginTop: isPromoter ? '2rem' : '0' }}>
                        <InfoCard title="Activate Your Account" icon="fa-rocket" fullWidth>
                            <p className="info-card-description" style={{textAlign: 'center'}}>
                                Activate your account with <strong>${activationAmount.toFixed(2)} USDT</strong> to start earning rewards. 
                                You can use your Main Wallet balance or deposit new funds to your unique address shown below.
                            </p>
                            <div className="activation-status">
                                <p>Main Wallet Balance: <strong>${mainWalletBalance.toFixed(2)}</strong></p>
                                <p>Newly Deposited: <strong>${depositedBalance.toFixed(2)}</strong></p>
                                <button className="btn-primary activate-btn" onClick={handleActivate} disabled={isActivating || !isActivationPossible}>
                                    {isActivating ? 'Activating...' : 'Activate My Account'}
                                </button>
                            </div>
                        </InfoCard>
                    </div>
                )}
                
                {!isPending && !canWithdrawPool && rewardProgramEarnings > 0 && (
                    <InfoCard title="Withdrawal Information" icon="fa-info-circle" fullWidth>
                        <p className="info-card-description" style={{textAlign: 'center', color: '#ffcc00', fontSize: '1rem'}}>
                            <i className="fa-solid fa-lock"></i> Your pool earnings are currently locked.
                            <br/>
                            You need <strong>3 active direct referrals</strong> to unlock and withdraw your full balance. You currently have <strong>{activeReferrals}</strong>.
                        </p>
                    </InfoCard>
                )}

                {!isPending && <div style={{marginBottom: '1.5rem'}}><StblRewardCard userData={userData} onClaimClick={() => setShowClaimRewardModal(true)} handleCopy={handleCopy} copied={copied} /></div>}

                <div className="dashboard-grid">
                    {!isPending && (
                        <>
                            <InfoCard title="Direct Referral Earnings" icon="fa-user-plus"><p><span>$</span>{totalReferralEarnings.toFixed(2)}</p></InfoCard>
                            <InfoCard title="Reward Program Earnings" icon="fa-sitemap"><p><span>$</span>{rewardProgramEarnings.toFixed(2)}</p></InfoCard>
                            <InfoCard title="Total Earnings" icon="fa-coins"><p><span>$</span>{totalEarnings.toFixed(2)}</p></InfoCard>
                            <InfoCard title="Available for Withdrawal" icon="fa-hand-holding-dollar">
                                <p><span>$</span>{totalWithdrawable.toFixed(2)}</p>
                                {!canWithdrawPool && rewardProgramEarnings > 0 && (
                                    <p className="info-card-description" style={{fontSize: '0.8rem', marginTop: '0.5rem', color: '#ffcc00'}}>(Pool earnings locked)</p>
                                )}
                            </InfoCard>
                            <InfoCard title="Main Wallet Balance" icon="fa-piggy-bank">
                                <p><span>$</span>{mainWalletBalance.toFixed(2)}</p>
                                <div className="card-actions" style={{justifyContent: 'center', marginTop: '1rem'}}>
                                     <button onClick={() => setShowTransferModal(true)} className="btn-primary" disabled={mainWalletBalance <= 0 && totalWithdrawable <= 0}><i className="fa-solid fa-paper-plane"></i> Transfer Funds</button>
                                </div>
                            </InfoCard>
                            <InfoCard title="Current Reward Stage" icon="fa-rocket"><p>{userData.current_pool > 0 ? `Reward ${userData.current_pool} / 10` : 'Not yet started'}</p></InfoCard>
                            <InfoCard title="Your Placement ID" icon="fa-id-card"><p style={{fontSize: '1.8rem', fontWeight: '700'}}>#{userData.global_placement_id || 'N/A'}</p></InfoCard>
                            <InfoCard title="Your Progress" icon="fa-road" fullWidth>
                                <RewardRoadmap currentReward={userData.current_pool} />
                                <div className="reward-potential"><i className="fa-solid fa-trophy"></i><span>Earn up to $20,410 in total rewards!</span></div>
                            </InfoCard>
                        </>
                    )}
                    <InfoCard title="Your Deposit Address" icon="fa-wallet"><p className="info-card-description">Deposit BEP-20 USDT to this address to fund your Main Wallet.</p><div className="referral-link-container"><span className="referral-link-text" style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{userData.wallet_address}</span><button onClick={() => handleCopy(userData.wallet_address, 'address')} className="copy-icon-btn"><i className={`fa-solid ${copied.address ? 'fa-check' : 'fa-copy'}`}></i></button></div><div style={{textAlign: 'center', marginTop: '1.5rem'}}><QRCodeSVG value={userData.wallet_address} size={128} bgColor="transparent" fgColor="#e0e0e0" /></div></InfoCard>
                    <InfoCard title="Your Payout Wallet" icon="fa-paper-plane"><p className="info-card-description">Your BEP-20 address to receive funds.</p>{userData.payout_wallet ? (<div className="wallet-address-display"><img src="/bsc-logo.svg" alt="BSC" className="chain-logo"/><span>{`${userData.payout_wallet.substring(0, 6)}...${userData.payout_wallet.substring(userData.payout_wallet.length - 4)}`}</span><button onClick={() => handleCopy(userData.payout_wallet, 'address')} className="copy-icon-btn minimal"><i className={`fa-solid ${copied.address ? 'fa-check' : 'fa-copy'}`}></i></button></div>) : (<p className="wallet-address large empty">Not Set</p>)}<div className="card-actions"><button onClick={() => setShowUpdateWalletModal(true)} className="btn-secondary"><i className="fa-solid fa-pencil"></i> {userData.payout_wallet ? 'Change' : 'Set'} Wallet</button><button onClick={() => setShowWithdrawModal(true)} className="btn-primary" disabled={totalWithdrawable <= 0}>Withdraw</button></div></InfoCard>
                    <InfoCard title="Your Referral Hub" icon="fa-share-nodes">
                        <p className="referral-stat">You have successfully referred <strong>{directReferralsCount}</strong> member{directReferralsCount !== 1 && 's'}.</p>
                        <div className="referral-link-container"><span className="referral-link-text">{referralLink}</span><button onClick={() => referralLink && handleCopy(referralLink, 'link')} disabled={!referralLink} className="copy-icon-btn"><i className={`fa-solid ${copied.link ? 'fa-check' : 'fa-copy'}`}></i></button></div>
                        <div className="share-actions"><QRCodeSVG value={referralLink} size={80} bgColor="transparent" fgColor="#e0e0e0" /><div className="social-share-buttons"><a href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Join me on Stabylink! ' + referralLink)}`} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-whatsapp"></i></a><a href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on Stabylink!')}`} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-telegram"></i></a><a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Join the Stabylink rewards program with my link: ')}&url=${encodeURIComponent(referralLink)}`} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-twitter"></i></a></div></div>
                        <div className="card-actions" style={{justifyContent: 'center', marginTop: '1rem'}}><Link to="/team" className="btn-secondary" style={{width: '100%'}}><i className="fa-solid fa-users" style={{marginRight: '0.5rem'}}></i> View My Team</Link></div>
                    </InfoCard>
                    <InfoCard title="Customer Support" icon="fa-headset"><p className="info-card-description">Have questions or need assistance? Our support team is here to help.</p><div className="card-actions" style={{justifyContent: 'center', marginTop: 'auto'}}><Link to="/support" className="btn-primary" style={{width: '100%'}}>Go to Support Center</Link></div></InfoCard>
                    {!isPending && statsData && <InfoCard title="Live Protocol Statistics" icon="fa-chart-pie"><div className="protocol-stats-container"><div className="protocol-stat-item"><span className="protocol-stat-value">{statsData.totalMembers}</span><span className="protocol-stat-label">Active Members</span></div><div className="protocol-stat-item"><span className="protocol-stat-value">${statsData.totalRewards}</span><span className="protocol-stat-label">Total Rewards Distributed</span></div></div></InfoCard>}
                </div>
                <div className="history-accordions">
                    <Accordion title="Deposit History" icon="fa-arrow-down-to-bracket" startOpen={false}><DepositHistory /></Accordion>
                    <Accordion title="Withdrawal History" icon="fa-arrow-up-from-bracket"><WithdrawalHistory /></Accordion>
                    <Accordion title="Your Direct Referrals" icon="fa-users" badgeCount={directReferralsCount}><DirectReferrals referrals={userData.directReferrals} isLoading={loading} /></Accordion>
                    <Accordion title="Direct Commission History" icon="fa-money-bill-wave"><CommissionHistory /></Accordion>
                    {isPromoter && (
                        <Accordion title="Promoter Commission History" icon="fa-crown">
                            <PromoterCommissionHistory />
                        </Accordion>
                    )}
                    <Accordion title="Fund Transfer History" icon="fa-right-left"><FundTransferHistory /></Accordion>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;