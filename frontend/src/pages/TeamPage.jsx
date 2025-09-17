import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './TeamPage.css'; // हम इसकी CSS को भी अपडेट करेंगे

// यह एक रिकर्सिव कंपोनेंट है जो टीम के हर सदस्य और उसकी टीम को दिखाता है
const TeamMember = ({ member, level }) => {
    const activationDate = member.activation_timestamp 
        ? new Date(member.activation_timestamp).toLocaleDateString() 
        : 'Pending';

    return (
        <>
            {/* सदस्य की जानकारी दिखाने वाली रो */}
            <tr className={`team-member-row level-${level}`}>
                {/* इंडेंटेशन के लिए खाली सेल */}
                <td style={{ paddingLeft: `${level * 20}px` }}>
                    <span className="level-indicator">{level > 0 ? '↳' : ''}</span>
                    {member.email}
                </td>
                <td>
                    <span className={`status-badge-team ${member.status.toLowerCase()}`}>
                        {member.status}
                    </span>
                </td>
                <td>{activationDate}</td>
            </tr>

            {/* इस सदस्य के बच्चों (डायरेक्ट रेफरल) के लिए इसी कंपोनेंट को फिर से कॉल करें */}
            {member.children && member.children.map(child => (
                <TeamMember key={child.id} member={child} level={level + 1} />
            ))}
        </>
    );
};

function TeamPage() {
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalTeamSize, setTotalTeamSize] = useState(0);

    // टीम के कुल सदस्यों की गिनती करने के लिए एक रिकर्सिव फंक्शन
    const countTeamMembers = (node) => {
        if (!node || !node.children) return 0;
        let count = node.children.length;
        node.children.forEach(child => {
            count += countTeamMembers(child);
        });
        return count;
    };

    useEffect(() => {
        apiService.getReferralTree()
            .then(response => {
                setTeamData(response.data);
                setTotalTeamSize(countTeamMembers(response.data));
            })
            .catch(() => setError('Could not load your team data. Please try again later.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="loading-message">Loading your team...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="team-page-container">
            <h1>My Referral Team</h1>
            {teamData && (
                 <p className="team-page-subtitle">
                    You have a total of <strong>{totalTeamSize}</strong> members in your downline.
                </p>
            )}
           
            <div className="team-list-container">
                <table className="team-table">
                    <thead>
                        <tr>
                            <th>Member Email</th>
                            <th>Status</th>
                            <th>Activation Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamData && teamData.children.length > 0 ? (
                            teamData.children.map(member => (
                                <TeamMember key={member.id} member={member} level={1} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="no-members-message">
                                    You haven't referred anyone yet. Share your link to start building your team!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TeamPage;