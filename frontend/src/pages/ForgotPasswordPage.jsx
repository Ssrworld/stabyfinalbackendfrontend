import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './Form.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setMessage('');
    try {
      await apiService.forgotPassword({ email });
    } catch (err) {
      // API कॉल में कोई भी एरर हो, उसे चुपचाप नज़रअंदाज़ कर दें ताकि हमलावर को कोई जानकारी न मिले।
      console.error("Forgot password silent error:", err);
    } finally {
      // हमेशा एक ही संदेश दिखाएं और यूजर को अगले स्टेप पर भेजें।
      setMessage('If an account with that email exists, an OTP will be sent. Redirecting to the reset page...');
      setTimeout(() => {
        // --- समाधान: URL से ईमेल हटा दिया गया है ---
        navigate(`/reset-password`);
      }, 3000); // रीडायरेक्ट करने से पहले संदेश पढ़ने के लिए थोड़ा समय दें।
    }
  };

  return (
    <div className="form-page-container">
        <div className="form-container">
            <div className="form-card animated-fade-in">
                <div className="form-logo-container">
                    <img src="/logo.svg" alt="Stabylink Logo" className="form-logo" />
                </div>
                <h2>Forgot Password</h2>
                <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-color-dark)', fontSize: '0.9rem' }}>
                    Enter your email to receive a password reset OTP.
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                    </div>
                    {message && <p style={{ color: '#4dff88', textAlign: 'center', marginBottom: '1rem' }}>{message}</p>}
                    <button type="submit" className="btn-primary" style={{width: '100%'}} disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset OTP'}
                    </button>
                </form>
                <div className="form-links" style={{justifyContent: 'center'}}>
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    </div>
  );
}
export default ForgotPasswordPage;