// frontend/src/components/GlobalAnnouncementModal.jsx (FINAL - CSS IMPORT REMOVED)

import React, { useState, useEffect } from 'react';
// import { useLocation } from 'react-router-dom'; // अब इसकी ज़रूरत नहीं है
import apiService from '../services/api';

 import './AnnouncementModal.css';

// यह कंपोनेंट अब सारा काम खुद करेगा: डेटा लाना, दिखाना, और बंद करना।
function GlobalAnnouncementModal() {
    // --- State Management ---
    const [announcements, setAnnouncements] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // --- Data Fetching Logic ---
    useEffect(() => {
        const hasBeenShown = sessionStorage.getItem('announcementShown') === 'true';
        if (hasBeenShown) return;

        apiService.getHomepageAnnouncements()
            .then(response => {
                if (response.data && response.data.length > 0) {
                    setAnnouncements(response.data);
                    setIsModalOpen(true);
                }
            })
            .catch(error => {
                console.error("Failed to fetch homepage announcements:", error);
            });
    }, []);

    // --- Close Handler Logic ---
    const handleClose = () => {
        setIsModalOpen(false);
        sessionStorage.setItem('announcementShown', 'true');
    };

    // --- Navigation and Controls Logic ---
    const goToPrevious = (e) => {
        e.stopPropagation();
        const isFirst = currentIndex === 0;
        const newIndex = isFirst ? announcements.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = (e) => {
        e.stopPropagation();
        const isLast = currentIndex === announcements.length - 1;
        const newIndex = isLast ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    // Escape की दबाने पर पॉप-अप बंद करें
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    if (!isModalOpen || announcements.length === 0) {
        return null;
    }

    const currentAnnouncement = announcements[currentIndex];

    // --- JSX / UI Rendering ---
    // CSS क्लास के नाम वही रहेंगे ताकि पुरानी स्टाइल काम करती रहे
    return (
        <div className="modal-overlay-announcement" onClick={handleClose}>
            <div className="modal-content-announcement" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn-announcement" onClick={handleClose}>
                    <i className="fa-solid fa-times"></i>
                </button>
                
                {currentAnnouncement.image_url && (
                    <img src={currentAnnouncement.image_url} alt={currentAnnouncement.subject} className="modal-image-announcement" />
                )}

                <div className="modal-text-content">
                    <h2>{currentAnnouncement.subject}</h2>
                    <p className="modal-date-announcement">{new Date(currentAnnouncement.created_at).toLocaleDateString()}</p>
                    <div className="modal-body-announcement" dangerouslySetInnerHTML={{ __html: currentAnnouncement.content }} />
                </div>
                
                {announcements.length > 1 && (
                    <div className="modal-controls-announcement">
                        <button onClick={goToPrevious}><i className="fa-solid fa-chevron-left"></i></button>
                        <span>{currentIndex + 1} / {announcements.length}</span>
                        <button onClick={goToNext}><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GlobalAnnouncementModal;
