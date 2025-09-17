import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import './UserMatrix.css'; // हम इसके लिए CSS भी बनाएंगे

const UserMatrix = ({ initialUserId }) => {
    const [matrixData, setMatrixData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState(initialUserId);

    useEffect(() => {
        const fetchMatrix = async (userId) => {
            if (!userId) return;
            setLoading(true);
            setError('');
            try {
                const response = await apiService.getAdminUserMatrix(userId);
                setMatrixData(response.data);
            } catch (err) {
                setError('Failed to load matrix data.');
            } finally {
                setLoading(false);
            }
        };

        fetchMatrix(currentUserId);
    }, [currentUserId]);

    const handleUserClick = (userId) => {
        // यदि आप चाहते हैं कि यह कंपोनेंट के अंदर नेविगेट करे
        // setCurrentUserId(userId);
        // यदि आप चाहते हैं कि पूरा पेज बदले, तो Link कंपोनेंट बेहतर है
    };

    if (loading) return <p>Loading Matrix...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!matrixData) return <p>No matrix data available.</p>;

    const { user, parent, children } = matrixData;

    return (
        <div className="matrix-container">
            {parent && (
                <div className="matrix-level parent-level">
                    <Link to={`/admin/users/${parent.id}`} className="matrix-node parent">
                        <i className="fa-solid fa-arrow-up"></i>
                        <span>Sponsor: {parent.email}</span>
                    </Link>
                </div>
            )}
            <div className="matrix-level current-level">
                <div className="matrix-node current">
                    <i className="fa-solid fa-user-circle"></i>
                    <span>{user.email} (Pool {user.current_pool})</span>
                </div>
            </div>
            <div className="matrix-level children-level">
                {children.map(child => (
                    <Link to={`/admin/users/${child.id}`} key={child.id} className={`matrix-node child ${child.type.toLowerCase()}`}>
                        <i className={`fa-solid ${child.type === 'Direct' ? 'fa-user-plus' : 'fa-parachute-box'}`}></i>
                        <span>{child.email}</span>
                        <span className="child-type">{child.type}</span>
                    </Link>
                ))}
                {children.length < 2 && Array.from({ length: 2 - children.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="matrix-node empty">
                        <span>Empty Slot</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserMatrix;