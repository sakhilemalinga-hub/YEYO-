import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvestorRegistration = () => {
  const { user, login, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company: '',
    investmentRange: '',
    investmentStage: '',
    additionalInfo: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API}/register/investor`,
        {
          name: user.name,
          email: user.email,
          user_type: 'investor',
          company: formData.company,
          additional_info: `Investment Range: ${formData.investmentRange}, Investment Stage: ${formData.investmentStage}, Additional Info: ${formData.additionalInfo}`
        },
        { withCredentials: true }
      );

      toast.success('Registration completed successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="registration-page">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="registration-page">
        <div className="registration-container">
          <div className="registration-card">
            <h1>Investor Registration</h1>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#64748b' }}>
              Please sign in with Google to continue your investor registration.
            </p>
            <button onClick={login} className="google-login-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/" style={{ color: '#3b82f6' }}>← Back to Home</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img 
              src="https://customer-assets.emergentagent.com/job_saas-launchpad/artifacts/oc7u6unx_YEYO%20LOGO.png" 
              alt="YEYO LAB" 
              style={{ height: '40px', marginBottom: '1rem' }}
            />
            <h1>Investor Registration</h1>
            <p style={{ color: '#64748b' }}>
              Welcome {user.name}! Complete your investor profile to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="company">Investment Firm / Company *</label>
              <Input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter your firm or company name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="investmentRange">Investment Range *</label>
              <select
                id="investmentRange"
                name="investmentRange"
                value={formData.investmentRange}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select investment range</option>
                <option value="$10K - $50K">$10K - $50K</option>
                <option value="$50K - $250K">$50K - $250K</option>
                <option value="$250K - $1M">$250K - $1M</option>
                <option value="$1M - $5M">$1M - $5M</option>
                <option value="$5M+">$5M+</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="investmentStage">Preferred Investment Stage *</label>
              <select
                id="investmentStage"
                name="investmentStage"
                value={formData.investmentStage}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select investment stage</option>
                <option value="Pre-Seed">Pre-Seed</option>
                <option value="Seed">Seed</option>
                <option value="Series A">Series A</option>
                <option value="Series B+">Series B+</option>
                <option value="All Stages">All Stages</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="additionalInfo">Areas of Interest (Optional)</label>
              <Textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                placeholder="Tell us about your investment thesis, preferred sectors, or what makes you excited about YEYO LAB..."
                rows={4}
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full" size="lg">
              {submitting ? 'Completing Registration...' : 'Complete Investor Registration'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
              Are you a founder instead?
            </p>
            <Link to="/register/founder" className="btn-secondary">
              Switch to Founder Registration
            </Link>
          </div>

          <p style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/" style={{ color: '#3b82f6' }}>← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvestorRegistration;