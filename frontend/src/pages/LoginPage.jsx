import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// --- useAuth को AuthContext से इम्पोर्ट किया गया है ---
import { useAuth } from '../context/AuthContext';
import './Form.css';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      // --- login फंक्शन अब userData ऑब्जेक्ट लौटाता है ---
      const userData = await login(formData);
      if (userData.isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
          <h2>Welcome Back!</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div className="form-group password-group">
              <label htmlFor="password">Password</label>
              <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} required disabled={isLoading} />
              <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {error && <p className="error-message-form">{error}</p>}
            <button type="submit" className="btn-primary" style={{width: '100%'}} disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          <div className="form-links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <span>
              Don't have an account? <Link to="/register">Register here</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;