import React from 'react';
import './RewardRoadmap.css'; // यह इम्पोर्ट अब सही है

// अंतिम योजना के अनुसार रिवॉर्ड नियम
const REWARD_RULES = [
    { reward: 1, payout: 10 }, 
    { reward: 2, payout: 20 }, 
    { reward: 3, payout: 40 }, 
    { reward: 4, payout: 80 }, 
    { reward: 5, payout: 160 }, 
    { reward: 6, payout: 320 }, 
    { reward: 7, payout: 640 }, 
    { reward: 8, payout: 1280 }, 
    { reward: 9, payout: 2560 }, 
    { reward: 10, payout: 15360 },
];

const RewardRoadmap = ({ currentReward }) => {
    return (
        <div className="pool-roadmap-container"> {/* CSS क्लास का नाम वही रखा है ताकि स्टाइल न टूटे */}
            <div className="roadmap-line"></div>
            {REWARD_RULES.map((rule) => {
                let status = 'upcoming';
                if (rule.reward < currentReward) {
                    status = 'completed';
                } else if (rule.reward === currentReward) {
                    status = 'active';
                }

                return (
                    <div className={`roadmap-node ${status}`} key={rule.reward}>
                        <div className="node-circle">
                            {status === 'completed' ? <i className="fa-solid fa-check"></i> : rule.reward}
                        </div>
                        <div className="node-tooltip">
                            <span>Reward {rule.reward}</span>
                            <strong>${rule.payout.toLocaleString()}</strong>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RewardRoadmap;