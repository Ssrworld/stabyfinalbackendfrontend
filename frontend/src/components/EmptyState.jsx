// frontend/src/components/EmptyState.jsx
import React from 'react';

const EmptyState = ({ message, icon }) => (
    <div className="empty-state">
        <i className={`fa-solid ${icon}`}></i>
        <p>{message}</p>
    </div>
);

export default EmptyState;