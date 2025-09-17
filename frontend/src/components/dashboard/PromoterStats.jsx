// frontend/src/components/dashboard/PromoterStats.jsx (A-to-Z CODE WITH NEW TEAM SIZE CARD)

import React from 'react';
import InfoCard from '../InfoCard';
import '../../pages/DashboardPage.css';
import './Promoter.css';

const PromoterStats = ({ promoterData, directReferralsCount, milestonesConfig }) => {
    if (!promoterData) {
        return null;
    }

    const milestones = milestonesConfig || {};
    let nextMilestoneReferrals = Infinity;
    let nextMilestoneReward = 0;
    const sortedMilestones = Object.keys(milestones).map(Number).sort((a, b) => a - b);

    for (const key of sortedMilestones) {
        if (key > directReferralsCount) {
            nextMilestoneReferrals = key;
            nextMilestoneReward = milestones[key];
            break;
        }
    }
    
    const progress = nextMilestoneReferrals !== Infinity ? (directReferralsCount / nextMilestoneReferrals) * 100 : 100;

    return (
        <div className="promoter-stats-container">
            <h3 className="promoter-section-title">
                <i className="fa-solid fa-crown"></i> Promoter Dashboard
            </h3>
            <div className="dashboard-grid">
                <InfoCard title="Extra USDT Commission Earned" icon="fa-dollar-sign">
                    <p><span>$</span>{promoterData.totalUsdtCommission}</p>
                </InfoCard>

                {/* ✅✅✅ START: नया कार्ड यहाँ जोड़ा गया है ✅✅✅ */}
                <InfoCard title="Total Team Size" icon="fa-users">
                    <p>{promoterData.totalTeamSize || 0}</p>
                </InfoCard>
                {/* ✅✅✅ END: नया कार्ड ✅✅✅ */}

                <InfoCard title="Total STBL Bonus Earned" icon="fa-star">
                    <p style={{fontSize: '2.5rem'}}><span>STBL</span> {parseFloat(promoterData.totalStblCommission).toLocaleString()}</p>
                </InfoCard>

                <InfoCard title="Next Token Milestone" icon="fa-trophy" fullWidth>
                    {nextMilestoneReferrals !== Infinity ? (
                        <>
                            <h4>Reach {nextMilestoneReferrals.toLocaleString()} Direct Referrals</h4>
                            <p className="info-card-description">
                                Unlock your next massive bonus of <strong>{nextMilestoneReward.toLocaleString()} STBL</strong> tokens!
                            </p>
                            <div className="reward-progress-bar">
                                <div className="reward-progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="reward-progress-text">
                                Your Progress: <strong>{directReferralsCount} / {nextMilestoneReferrals.toLocaleString()}</strong> Active Referrals
                            </p>
                        </>
                    ) : (
                        <div style={{textAlign: 'center', padding: '1rem'}}>
                            <h4><i className="fa-solid fa-party-horn"></i> Congratulations!</h4>
                            <p>You have achieved all available promoter milestones!</p>
                        </div>
                    )}
                </InfoCard>
            </div>
        </div>
    );
};

export default PromoterStats;