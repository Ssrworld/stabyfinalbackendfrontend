// frontend/src/components/Accordion.jsx
import React, { useState } from 'react';

const Accordion = ({ title, icon, children, badgeCount, startOpen = false, onToggle }) => {
    const [isOpen, setIsOpen] = useState(startOpen);

    const handleToggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (onToggle) {
            onToggle(newState);
        }
    };

    return (
        <div className="accordion-item">
            <button className="accordion-header" onClick={handleToggle}>
                <div className="accordion-title">
                    <i className={`fa-solid ${icon}`}></i>
                    <h4>{title}</h4>
                    {badgeCount !== undefined && <span className="accordion-badge">{badgeCount}</span>}
                </div>
                <i className={`fa-solid fa-chevron-down accordion-arrow ${isOpen ? 'open' : ''}`}></i>
            </button>
            <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                {/* बच्चों को isOpen prop पास करें ताकि वे लेज़ी लोडिंग कर सकें */}
                {React.cloneElement(children, { isOpen })}
            </div>
        </div>
    );
};

export default Accordion;