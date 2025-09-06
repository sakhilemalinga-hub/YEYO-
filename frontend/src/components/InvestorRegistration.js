import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

const InvestorRegistration = () => {
  const { user, updateProfile, loading } = useContext(AuthContext);
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
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateProfile({
        user_type: 'investor',
        company: formData.company,
        additional_info: `Investment Range: ${formData.investmentRange}, Investment Stage: ${formData.investmentStage}, Additional Info: ${formData.additionalInfo}`
      });

      if (result.success) {
        toast.success('Investor profile completed successfully!');
        navigate('/profile');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Profile update failed. Please try again.');
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
            <h1>Investor Profile</h1>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#64748b' }}>
              Please sign in to complete your investor profile.
            </p>
            <Link to="/login" className="btn-primary">
              Sign In
            </Link>
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
            <h1>Complete Investor Profile</h1>
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
              {submitting ? 'Updating Profile...' : 'Complete Investor Profile'}
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