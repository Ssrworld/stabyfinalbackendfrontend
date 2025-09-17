// frontend/src/components/dashboard/PromoterStats.jsx (UPDATED FOR TEAM-BASED MILESTONES)

import React from 'react';
import InfoCard from '../InfoCard';
import '../../pages/DashboardPage.css';
import './Promoter.css';

const PromoterStats = ({ promoterData, milestonesConfig }) => {
    if (!promoterData) {
        return null;
    }

    // ✅ Use the new totalActiveTeamSize for milestone calculation
    const activeTeamMembers = promoterData.totalActiveTeamSize || 0;
    const directActiveReferrals = promoterData.directActiveReferralsCount || 0; // Still available if needed elsewhere

    const milestones = milestonesConfig || {};
    let nextMilestoneReferrals = Infinity;
    let nextMilestoneReward = 0;
    const sortedMilestones = Object.keys(milestones).map(Number).sort((a, b) => a - b);

    for (const key of sortedMilestones) {
        if (key > activeTeamMembers) { // ✅ Check against team members count
            nextMilestoneReferrals = key;
            nextMilestoneReward = milestones[key];
            break;
        }
    }
    
    // ✅ Progress is now based on active team members
    const progress = nextMilestoneReferrals !== Infinity ? (activeTeamMembers / nextMilestoneReferrals) * 100 : 100;

    return (
        <div className="promoter-stats-container">
            <h3 className="promoter-section-title">
                <i className="fa-solid fa-crown"></i> Promoter Dashboard
            </h3>
            <div className="dashboard-grid">
                <InfoCard title="Extra USDT Commission Earned" icon="fa-dollar-sign">
                    <p><span>$</span>{promoterData.totalUsdtCommission}</p>
                </InfoCard>

                <InfoCard title="Total Direct Referrals (Active)" icon="fa-user-plus">
                    <p>{directActiveReferrals}</p>
                </InfoCard>

                <InfoCard title="Total Active Team Size" icon="fa-users">
                    <p>{activeTeamMembers}</p>
                </InfoCard>

                <InfoCard title="Total STBL Bonus Earned" icon="fa-star">
                    <p style={{fontSize: '2.5rem'}}><span>STBL</span> {parseFloat(promoterData.totalStblCommission).toLocaleString()}</p>
                </InfoCard>

                <InfoCard title="Next Token Milestone" icon="fa-trophy" fullWidth>
                    {nextMilestoneReferrals !== Infinity ? (
                        <>
                            {/* ✅ Text updated to "Active Team Members" */}
                            <h4>Reach {nextMilestoneReferrals.toLocaleString()} Active Team Members</h4>
                            <p className="info-card-description">
                                Unlock your next massive bonus of <strong>{nextMilestoneReward.toLocaleString()} STBL</strong> tokens!
                            </p>
                            <div className="reward-progress-bar">
                                <div className="reward-progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="reward-progress-text">
                                {/* ✅ Progress text and variable updated */}
                                Your Progress: <strong>{activeTeamMembers} / {nextMilestoneReferrals.toLocaleString()}</strong> Active Team Members
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