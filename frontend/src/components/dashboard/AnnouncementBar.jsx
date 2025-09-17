// frontend/src/components/dashboard/AnnouncementBar.jsx
import React, { useState, useEffect } from 'react';
import './AnnouncementBar.css';

const AnnouncementBar = ({ announcements }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        setCurrentIndex(0);
    }, [announcements]);

    if (!announcements || announcements.length === 0 || !isVisible) {
        return null;
    }

    const currentAnnouncement = announcements[currentIndex];

    const goToPrevious = () => {
        const isFirst = currentIndex === 0;
        const newIndex = isFirst ? announcements.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLast = currentIndex === announcements.length - 1;
        const newIndex = isLast ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    return (
        <div className="announcement-bar">
            <div className="announcement-content-wrapper">
                <div className="announcement-icon">
                    <i className="fa-solid fa-bullhorn"></i>
                </div>
                <div className="announcement-text">
                    <strong>{currentAnnouncement.subject}</strong>
                    <div className="announcement-body" dangerouslySetInnerHTML={{ __html: currentAnnouncement.content }} />
                </div>
            </div>
            <div className="announcement-controls">
                {announcements.length > 1 && (
                    <>
                        <button onClick={goToPrevious}><i className="fa-solid fa-chevron-left"></i></button>
                        <span>{currentIndex + 1} / {announcements.length}</span>
                        <button onClick={goToNext}><i className="fa-solid fa-chevron-right"></i></button>
                    </>
                )}
                <button onClick={() => setIsVisible(false)} className="dismiss-btn"><i className="fa-solid fa-times"></i></button>
            </div>
        </div>
    );
};

export default AnnouncementBar;
