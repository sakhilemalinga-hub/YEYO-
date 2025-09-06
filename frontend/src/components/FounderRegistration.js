import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

const FounderRegistration = () => {
  const { user, updateProfile, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company: '',
    stage: '',
    revenue: '',
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
        user_type: 'founder',
        company: formData.company,
        additional_info: `Stage: ${formData.stage}, Revenue: ${formData.revenue}, Additional Info: ${formData.additionalInfo}`
      });

      if (result.success) {
        toast.success('Founder profile completed successfully!');
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
            <h1>Founder Profile</h1>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#64748b' }}>
              Please sign in to complete your founder profile.
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
            <h1>Complete Founder Profile</h1>
            <p style={{ color: '#64748b' }}>
              Welcome {user.name}! Complete your founder profile to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="company">Company / Startup Name *</label>
              <Input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter your company or startup name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="stage">Current Stage *</label>
              <select
                id="stage"
                name="stage"
                value={formData.stage}
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
                <option value="">Select current stage</option>
                <option value="Idea Stage">Idea Stage</option>
                <option value="MVP Development">MVP Development</option>
                <option value="Early Traction">Early Traction (&lt; $5K MRR)</option>
                <option value="Growth Stage">Growth Stage ($5K+ MRR)</option>
                <option value="Scaling">Scaling ($50K+ MRR)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="revenue">Current Monthly Revenue</label>
              <select
                id="revenue"
                name="revenue"
                value={formData.revenue}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select revenue range</option>
                <option value="$0">$0 (Pre-Revenue)</option>
                <option value="$1 - $1K">$1 - $1K</option>
                <option value="$1K - $5K">$1K - $5K</option>
                <option value="$5K - $25K">$5K - $25K</option>
                <option value="$25K - $100K">$25K - $100K</option>
                <option value="$100K+">$100K+</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="additionalInfo">Tell Us About Your Vision</label>
              <Textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                placeholder="Describe your startup, the problem you're solving, your domain expertise, and why you're excited about partnering with YEYO LAB..."
                rows={4}
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full" size="lg">
              {submitting ? 'Updating Profile...' : 'Complete Founder Profile'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
              Are you an investor instead?
            </p>
            <Link to="/register/investor" className="btn-secondary">
              Switch to Investor Registration
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

export default FounderRegistration;