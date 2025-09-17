// frontend/src/components/Layout.jsx (UPDATED)

import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

function Layout() {
    // --- isLoggedIn को भी context से प्राप्त करें ताकि user ऑब्जेक्ट के खाली होने पर भी स्थिति पता चले ---
    const { user, isLoggedIn, logout } = useAuth();
    const [vantaEffect, setVantaEffect] = useState(null);
    const vantaRef = useRef(null);

    useEffect(() => {
        let effect = null;
        if (window.VANTA) {
            effect = window.VANTA.NET({
                el: vantaRef.current,
                THREE: window.THREE,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                color: 0x7e22ce,
                backgroundColor: 0x0d0c22,
                points: 12.00,
                maxDistance: 25.00,
                spacing: 18.00
            });
            setVantaEffect(effect);
        }
        return () => {
            if (effect) effect.destroy();
        };
    }, []);

    // --- ✅ समाधान: handleExitImpersonation फंक्शन को अपडेट किया गया ---
    const handleExitImpersonation = () => {
        const adminToken = sessionStorage.getItem('admin_token');
        if (adminToken) {
            localStorage.setItem('token', adminToken);
            sessionStorage.removeItem('admin_token');
            // सीधे एडमिन डैशबोर्ड पर भेजें और पेज को रीलोड करें ताकि AuthContext अपडेट हो जाए
            window.location.href = '/admin/dashboard'; 
        } else {
            // यदि किसी कारण से एडमिन टोकन नहीं मिलता है, तो बस लॉगआउट करें
            logout();
        }
    };

    const isImpersonating = !!sessionStorage.getItem('admin_token');

    return (
        <div className="layout">
            <div ref={vantaRef} className="vanta-background"></div>
            <header>
                <div className="logo">
                    <Link to="/">
                        <img src="/logo.svg" alt="Stabylink Logo" className="logo-image" />
                    </Link>
                </div>
                <nav>
                    {/* जब एडमिन प्रतिरूपण कर रहा हो */}
                    {isImpersonating && (
                        <button 
                            onClick={handleExitImpersonation} 
                            className="nav-button logout" 
                            style={{ borderColor: '#ff4d4d', color: '#ff4d4d' }}
                        >
                            <i className="fa-solid fa-person-walking-arrow-right" style={{marginRight: '0.5rem'}}></i>
                            Exit User View
                        </button>
                    )}

                    {/* जब उपयोगकर्ता लॉग इन हो और प्रतिरूपण नहीं कर रहा हो */}
                    {isLoggedIn && !isImpersonating && (
                        <>
                            {user.isAdmin ? (
                                <NavLink to="/admin/dashboard" className="nav-link">Admin Panel</NavLink>
                            ) : (
                                <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
                            )}
                            <button onClick={logout} className="nav-button logout">Logout</button>
                        </>
                    )}

                    {/* जब कोई भी लॉग इन न हो */}
                    {!isLoggedIn && !isImpersonating && (
                        <>
                            <NavLink to="/login" className="nav-link">Login</NavLink>
                            <NavLink to="/register" className="nav-button register">Join Program</NavLink>
                        </>
                    )}
                </nav>
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;