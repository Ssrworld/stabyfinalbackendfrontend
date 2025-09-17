// frontend/src/pages/RegisterPage.jsx (A-to-Z CODE WITH PASSWORD VALIDATION FIX)

import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';
import './Form.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import TermsModal from '../components/TermsModal'; 

const PasswordStrengthIndicator = ({ password }) => {
    if (!password) return null;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        // ✅✅✅ समाधान: यहाँ गलत रेगुलर एक्सप्रेशन को ठीक किया गया है ✅✅✅
        number: /\d/.test(password), // पहले यह /\d]/ था, जो गलत था
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


function RegisterPage() {
  const { referralCode } = useParams();
  const navigate = useNavigate();
  const [isReferralMissing, setIsReferralMissing] = useState(!referralCode);
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [mobileNumber, setMobileNumber] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) { newErrors.email = 'Email is required.'; } else if (!/\S+@\S+\.\S+/.test(formData.email)) { newErrors.email = 'Email address is invalid.'; }
    if (!mobileNumber) { newErrors.mobile = 'Mobile number is required.'; } else if (!isValidPhoneNumber(mobileNumber)) { newErrors.mobile = 'Mobile number is not valid for the selected country.'; }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
    if (!formData.password) { newErrors.password = 'Password is required.'; } else if (!passwordRegex.test(formData.password)) { newErrors.password = 'Password does not meet all requirements.'; }
    if (formData.password !== formData.confirmPassword) { newErrors.confirmPassword = 'Passwords do not match.'; }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReferralMissing) {
        setErrors({ api: "Registration is only possible with a valid referral link." });
        return;
    }
    if (!validateForm()) { return; }
    if (!agreedToTerms) {
        setErrors({ api: "You must agree to the Terms and Conditions to register." });
        return;
    }
    if (isLoading) return;
    setMessage('');
    setIsLoading(true);
    try {
      await apiService.registerUser({
        email: formData.email,
        password: formData.password,
        referralCode: referralCode,
        mobile_number: mobileNumber,
      });
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => { navigate('/login'); }, 2000);
    } catch (err) {
      setErrors({ api: err.response?.data?.message || 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-page-container">
      {isTermsModalOpen && <TermsModal onClose={() => setIsTermsModalOpen(false)} />}
      <div className="form-container">
        <div className="form-card animated-fade-in">
            <div className="form-logo-container">
                <img src="/logo.svg" alt="Stabylink Logo" className="form-logo" />
            </div>
            <h2>Create Your Account</h2>
            {isReferralMissing ? (
                <div style={{ textAlign: 'center', color: '#ff4d4d', marginBottom: '1rem', border: '1px solid #ff4d4d', padding: '0.75rem', borderRadius: '4px', fontSize: '0.9rem', backgroundColor: 'rgba(255, 77, 77, 0.1)' }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.5rem' }}></i>
                    <strong>Registration is only possible with a referral link.</strong>
                    <p style={{marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-color-dark)'}}>Please use the link provided by the person who referred you.</p>
                </div>
            ) : (
                <p style={{ textAlign: 'center', color: '#4dff88', marginBottom: '1rem', border: '1px solid #4dff88', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                    You are being referred by: <strong>{referralCode}</strong>
                </p>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <fieldset disabled={isReferralMissing || isLoading}>
                  <div className="form-group"><label htmlFor="email">Email Address</label><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />{errors.email && <p className="error-message-inline">{errors.email}</p>}</div>
                  <div className="form-group"><label htmlFor="mobile_number">Mobile Number</label><PhoneInput id="mobile_number" placeholder="e.g., +919876543210" value={mobileNumber} onChange={setMobileNumber} defaultCountry="IN" international countryCallingCodeEditable={false} className="phone-input-container" />{errors.mobile && <p className="error-message-inline">{errors.mobile}</p>}</div>
                  <div className="form-group"><label htmlFor="password">Password</label><div className="password-group"><input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} required /><button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}><i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button></div>{errors.password && <p className="error-message-inline">{errors.password}</p>}<PasswordStrengthIndicator password={formData.password} /></div>
                  <div className="form-group"><label htmlFor="confirmPassword">Confirm Password</label><div className="password-group"><input type={showPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required /></div>{errors.confirmPassword && <p className="error-message-inline">{errors.confirmPassword}</p>}</div>
                  <div className="form-group-checkbox" style={{ justifyContent: 'flex-start', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'nowrap' }}>
                    <input type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} style={{ flexShrink: 0, marginTop: '2px' }}/>
                    <label htmlFor="terms">
                        I agree to the&nbsp;
                        <button type="button" className="terms-link" onClick={() => setIsTermsModalOpen(true)}>
                            Terms and Conditions
                        </button>
                    </label>
                  </div>
              </fieldset>
              {errors.api && <p className="error-message-form">{errors.api}</p>}
              {message && <p style={{ color: '#4dff88', textAlign: 'center', marginBottom: '1rem' }}>{message}</p>}
              <button type="submit" className="btn-primary" style={{ width: '100%'}} disabled={isLoading || !agreedToTerms || isReferralMissing}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
            <div className="form-links" style={{justifyContent: 'center', marginTop: '1.5rem'}}>
              <span> Already have an account? <Link to="/login">Login here</Link> </span>
            </div>
        </div>
      </div>
    </div>
  );
}
export default RegisterPage;