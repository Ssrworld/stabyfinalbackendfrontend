// File: frontend/src/components/InfoCard.jsx

import React from 'react';

// ध्यान दें: इस कंपोनेंट की CSS स्टाइल `DashboardPage.css` में लिखी हुई है,
// इसलिए यहाँ अलग से CSS इम्पोर्ट करने की ज़रूरत नहीं है।
// अगर आप भविष्य में इसकी स्टाइल अलग करना चाहें, तो आप một नई CSS फाइल बनाकर
// उसे यहाँ इम्पोर्ट कर सकते हैं।

/**
 * एक दोबारा इस्तेमाल किया जा सकने वाला कार्ड कंपोनेंट जो जानकारी दिखाता है।
 *
 * @param {object} props - कंपोनेंट के प्रोप्स।
 * @param {string} [props.title] - कार्ड का शीर्षक।
 * @param {string} [props.icon] - FontAwesome आइकॉन क्लास (जैसे, 'fa-wallet')।
 * @param {React.ReactNode} props.children - कार्ड के अंदर दिखाने वाला कंटेंट।
 * @param {boolean} [props.fullWidth=false] - क्या कार्ड को ग्रिड की पूरी चौड़ाई लेनी चाहिए।
 * @param {boolean} [props.insideAccordion=false] - क्या कार्ड एक अकॉर्डियन के अंदर है (यह कुछ स्टाइल हटा देता है)।
 */
const InfoCard = ({ title, icon, children, fullWidth = false, insideAccordion = false }) => {
    // CSS क्लासेस को शर्तों के आधार पर जोड़ने के लिए एक स्ट्रिंग बनाते हैं।
    const cardClasses = [
        'info-card',
        fullWidth ? 'full-width' : '',
        insideAccordion ? 'inside-accordion' : ''
    ].join(' ').trim(); // join(' ') से क्लास के बीच स्पेस आता है, trim() फालतू स्पेस हटाता है।

    return (
        <div className={cardClasses}>
            {/* यह सेक्शन तभी दिखेगा जब 'title' प्रोप दिया गया हो */}
            {title && (
                <div className="info-card-header">
                    {/* यह आइकॉन तभी दिखेगा जब 'icon' प्रोप दिया गया हो */}
                    {icon && <i className={`fa-solid ${icon}`}></i>}
                    <h4>{title}</h4>
                </div>
            )}
            
            <div className="info-card-content">
                {children}
            </div>
        </div>
    );
};

// कंपोनेंट को एक्सपोर्ट करें ताकि इसे दूसरी फाइलों में इम्पोर्ट किया जा सके।
export default InfoCard;