// frontend/src/pages/ResetPasswordPage.jsx (FULLY UPDATED)

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../services/api';
import './Form.css';

// यह कंपोनेंट पासवर्ड की मजबूती को विज़ुअली दिखाता है
const PasswordStrengthIndicator = ({ password }) => {
    if (!password) return null;
    
    // ✅ समाधान: स्पेशल कैरेक्टर की जाँच को नए, अधिक लचीले Regex से बदलें
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password),
    };

    const Requirement = ({ label, met }) => (
        <li style={{ color: met ? '#4dff88' : '#ff4d4d', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', listStyle: 'none' }}>
            <i className={`fa-solid fa-xs ${met ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
            <span>{label}</span>
        </li>
    );

    return (
        <ul style={{ marginTop: '0.75rem', paddingLeft: '0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <Requirement label="8+ characters" met={checks.length} />
            <Requirement label="1 lowercase" met={checks.lowercase} />
            <Requirement label="1 uppercase" met={checks.uppercase} />
            <Requirement label="1 number" met={checks.number} />
            <Requirement label="1 special" met={checks.specialChar} />
        </ul>
    );
};

function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({ otp: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    // ✅ समाधान: नए, अधिक लचीले Regex का उपयोग करें
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
        setError("Password is not strong enough.");
        return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await apiService.resetPassword({ ...formData, email });
      setMessage(response.data.message + ' Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="form-page-container">
        <div className="form-container">
            <div className="form-card animated-fade-in">
                <div className="form-logo-container">
                    <img src="/logo.svg" alt="Stabylink Logo" className="form-logo" />
                </div>
                <h2>Reset Your Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Your Email Address</label>
                        <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="otp">Enter 6-Digit OTP</label>
                        <input type="text" id="otp" name="otp" value={formData.otp} onChange={handleChange} maxLength="6" required disabled={isLoading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Enter New Password</label>
                        <div className="password-group">
                            <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} required disabled={isLoading} />
                            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        <PasswordStrengthIndicator password={formData.password} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <div className="password-group">
                            <input type={showPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} />
                        </div>
                    </div>
                    {message && <p style={{ color: '#4dff88', textAlign: 'center', marginBottom: '1rem' }}>{message}</p>}
                    {error && <p className="error-message-form">{error}</p>}
                    <button type="submit" className="btn-primary" style={{width: '100%'}} disabled={isLoading}>
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
                <div className="form-links" style={{justifyContent: 'center', marginTop: '1.5rem'}}>
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    </div>
  );
}
export default ResetPasswordPage;
